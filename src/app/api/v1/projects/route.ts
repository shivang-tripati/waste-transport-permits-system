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
import { createProjectSchema } from '@/schemas';
import { Prisma } from '@prisma/client';

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'name', 'city'];

export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;
        const { searchParams } = new URL(request.url);
        const { page, limit, skip } = parsePagination(searchParams);
        const { field: sortField, order: sortOrder } = parseSort(searchParams, SORTABLE_FIELDS);

        const where: Prisma.ProjectWhereInput = {};

        // Non-admins can only see their company's projects
        if (!isAdmin(user.role)) {
            if (user.companyId) {
                where.companyId = user.companyId;
            } else {
                // Individual users - no projects to show
                return createSuccessResponse([], createPaginationMeta(page, limit, 0));
            }
        }

        // Filter by company
        const companyId = searchParams.get('companyId');
        if (companyId && isAdmin(user.role)) {
            where.companyId = companyId;
        }

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
                { city: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder },
                include: {
                    company: { select: { id: true, name: true } },
                    _count: { select: { permits: true } },
                },
            }),
            prisma.project.count({ where }),
        ]);

        return createSuccessResponse(projects, createPaginationMeta(page, limit, total));
    } catch (error) {
        console.error('List projects error:', error);
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

        // Check permissions
        if (!hasPermission(user.role, 'project:create')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to create projects')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = createProjectSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const data = validation.data;

        // Verify company exists
        const company = await prisma.company.findUnique({
            where: { id: data.companyId },
        });

        if (!company) {
            return createErrorResponse(CommonErrors.notFound('Company'));
        }

        // Non-admins can only create projects for their own company
        if (!isAdmin(user.role)) {
            if (user.companyId !== data.companyId) {
                return createErrorResponse(
                    CommonErrors.forbidden('You can only create projects for your own company')
                );
            }
        }

        // Create project
        const project = await prisma.project.create({
            data,
            include: {
                company: { select: { id: true, name: true } },
            },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PROJECT',
            entityId: project.id,
            action: 'CREATED',
            performedByUserId: user.userId,
            newState: { name: project.name, companyId: project.companyId },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(project, undefined, 201);
    } catch (error) {
        console.error('Create project error:', error);
        return createErrorResponse(error);
    }
}
