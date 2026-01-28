import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission, isAdmin } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
    parsePagination,
    parseSort,
    createPaginationMeta,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { createCompanySchema } from '@/schemas';
import { Prisma } from '@prisma/client';

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'name'];

export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Only admins can list all companies
        if (!hasPermission(user.role, 'company:read')) {
            // Non-admins can only see their own company
            if (user.companyId) {
                const company = await prisma.company.findUnique({
                    where: { id: user.companyId },
                });
                return createSuccessResponse(company ? [company] : []);
            }
            return createSuccessResponse([]);
        }

        const { searchParams } = new URL(request.url);
        const { page, limit, skip } = parsePagination(searchParams);
        const { field: sortField, order: sortOrder } = parseSort(searchParams, SORTABLE_FIELDS);

        const where: Prisma.CompanyWhereInput = {};

        // Filter by active status
        const isActive = searchParams.get('isActive');
        if (isActive !== null) {
            where.isActive = isActive === 'true';
        }

        // Search
        const search = searchParams.get('search');
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { registrationNumber: { contains: search, mode: 'insensitive' } },
                { gstNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder },
                include: {
                    _count: { select: { users: true, projects: true } },
                    projects: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                            state: true,
                        },
                        where: { isActive: true }
                    },
                },
            }),
            prisma.company.count({ where }),
        ]);

        return createSuccessResponse(companies, createPaginationMeta(page, limit, total));
    } catch (error) {
        console.error('List companies error:', error);
        return createErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Only admins can create companies
        if (!hasPermission(user.role, 'company:create')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to create companies')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = createCompanySchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const data = validation.data;

        // Check for unique registration number
        if (data.registrationNumber) {
            const existing = await prisma.company.findUnique({
                where: { registrationNumber: data.registrationNumber },
            });
            if (existing) {
                return createErrorResponse(
                    CommonErrors.conflict('A company with this registration number already exists')
                );
            }
        }

        // Check for unique GST number
        if (data.gstNumber) {
            const existing = await prisma.company.findUnique({
                where: { gstNumber: data.gstNumber },
            });
            if (existing) {
                return createErrorResponse(
                    CommonErrors.conflict('A company with this GST number already exists')
                );
            }
        }

        // Create company
        const company = await prisma.company.create({
            data,
        });

        // Create audit log
        await createAuditLog({
            entityType: 'COMPANY',
            entityId: company.id,
            action: 'CREATED',
            performedByUserId: user.userId,
            newState: { name: company.name },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(company, undefined, 201);
    } catch (error) {
        console.error('Create company error:', error);
        return createErrorResponse(error);
    }
}
