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
import  {log} from '@/lib/logger';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { createPlantSchema } from '@/schemas';
import { Prisma } from '@prisma/client';

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'name', 'code', 'city'];

export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { searchParams } = new URL(request.url);
        const { page, limit, skip } = parsePagination(searchParams);
        const { field: sortField, order: sortOrder } = parseSort(searchParams, SORTABLE_FIELDS);

        const where: Prisma.PlantWhereInput = {};

        // Filter by active status (default to active)
        const isActive = searchParams.get('isActive');
        if (isActive === null || isActive === 'true') {
            where.isActive = true;
        } else if (isActive === 'false') {
            where.isActive = false;
        }

        // Search
        const search = searchParams.get('search');
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Filter by city
        const city = searchParams.get('city');
        if (city) {
            where.city = { contains: city, mode: 'insensitive' };
        }

        const [plants, total] = await Promise.all([
            prisma.plant.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder },
                include: {
                    _count: { select: { permits: true, weighments: true } },
                },
            }),
            prisma.plant.count({ where }),
        ]);

        return createSuccessResponse(plants, createPaginationMeta(page, limit, total));
    } catch (error) {
        log.error('List plants error:', error);
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

        // Only admins can create plants
        if (!hasPermission(user.role, 'plant:create')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to create plants')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = createPlantSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const data = validation.data;

        // Check for unique code
        const existing = await prisma.plant.findUnique({
            where: { code: data.code },
        });

        if (existing) {
            return createErrorResponse(
                CommonErrors.conflict('A plant with this code already exists')
            );
        }

        // Create plant
        const plant = await prisma.plant.create({
            data,
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PLANT',
            entityId: plant.id,
            action: 'CREATED',
            performedByUserId: user.userId,
            newState: { name: plant.name, code: plant.code },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(plant, undefined, 201);
    } catch (error) {
        log.error('Create plant error:', error);
        return createErrorResponse(error);
    }
}
