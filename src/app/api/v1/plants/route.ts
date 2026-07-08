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

/**
 * @swagger
 * /api/v1/plants:
 *   get:
 *     summary: List plants
 *     description: Returns paginated list of waste processing plants. Defaults to active plants.
 *     tags:
 *       - Plants
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, code, city]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, code, or city
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *     responses:
 *       200:
 *         description: Paginated list of plants
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /api/v1/plants:
 *   post:
 *     summary: Create a plant
 *     description: Creates a new waste processing plant. Admin only.
 *     tags:
 *       - Plants
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - address
 *               - city
 *               - state
 *               - pincode
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *               address:
 *                 type: string
 *                 minLength: 5
 *               city:
 *                 type: string
 *                 minLength: 2
 *               state:
 *                 type: string
 *                 minLength: 2
 *               pincode:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *                 pattern: '^\+?[1-9]\d{9,14}$'
 *               operatingHours:
 *                 type: string
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Capacity in tons per day
 *     responses:
 *       201:
 *         description: Plant created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Duplicate plant code
 */
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
