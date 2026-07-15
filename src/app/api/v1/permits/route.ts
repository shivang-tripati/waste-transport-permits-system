import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, withPermission } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
    parsePagination,
    parseSort,
    createPaginationMeta,
} from '@/lib/api';
import { log } from '@/lib/logger';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { createPermitSchema } from '@/schemas';
import { generatePermitNumber, parsePermitDateTime } from '@/lib/utils';
import { Prisma } from '@prisma/client';

// Fields allowed for sorting
const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'status', 'permitNumber'];
// Fields allowed for filtering
const FILTERABLE_FIELDS = ['status', 'wasteType', 'projectId', 'plantId'];

/**
 * @swagger
 * /api/v1/permits:
 *   get:
 *     summary: List permits
 *     description: >
 *       Returns paginated permits. Admins see all; company users see
 *       their company's permits; individual users see only their own.
 *     tags:
 *       - Permits
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
 *           enum: [createdAt, updatedAt, status, permitNumber]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, IN_TRANSIT, COMPLETED, EXPIRED, REJECTED, CANCELLED]
 *       - in: query
 *         name: wasteType
 *         schema:
 *           type: string
 *           enum: [CND_SEGREGATED, CND_UNSEGREGATED]
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: plantId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by permit number, driver name, or vehicle number
 *     responses:
 *       200:
 *         description: Paginated list of permits
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

        const { user } = authResult;
        const { searchParams } = new URL(request.url);

        // Parse pagination and sorting
        const { page, limit, skip } = parsePagination(searchParams);
        const { field: sortField, order: sortOrder } = parseSort(searchParams, SORTABLE_FIELDS);

        // Build where clause based on role
        const where: Prisma.PermitWhereInput = {};

        // Non-admins can only see their own permits (or company permits)
        if (user.role !== 'ADMIN') {
            if (user.companyId) {
                // Company users can see all permits for their company's projects
                where.project = { companyId: user.companyId };
            } else {
                // Individual users can only see their own permits
                where.userId = user.userId;
            }
        }

        // Apply filters
        const status = searchParams.get('status');
        if (status) {
            where.status = status as Prisma.EnumPermitStatusFilter['equals'];
        }

        const wasteType = searchParams.get('wasteType');
        if (wasteType) {
            where.wasteType = wasteType as Prisma.EnumWasteTypeFilter['equals'];
        }

        const projectId = searchParams.get('projectId');
        if (projectId) {
            where.projectId = projectId;
        }

        const plantId = searchParams.get('plantId');
        if (plantId) {
            where.plantId = plantId;
        }

        // Search by permit number
        const search = searchParams.get('search');
        if (search) {
            where.OR = [
                { permitNumber: { contains: search, mode: 'insensitive' } },
                { driverName: { contains: search, mode: 'insensitive' } },
                { vehicleNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Query
        const [permits, total] = await Promise.all([
            prisma.permit.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder },
                include: {
                    project: {
                        select: { id: true, name: true, address: true, city: true },
                    },
                    plant: {
                        select: { id: true, name: true, code: true, city: true },
                    },
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
            prisma.permit.count({ where }),
        ]);

        return createSuccessResponse(permits, createPaginationMeta(page, limit, total));
    } catch (error) {
        log.error('List permits error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/permits:
 *   post:
 *     summary: Create a permit
 *     description: Creates a new waste transport permit in DRAFT status.
 *     tags:
 *       - Permits
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wasteType
 *               - plantId
 *               - pickupAddress
 *               - pickupCity
 *               - pickupState
 *               - pickupPincode
 *             properties:
 *               wasteType:
 *                 type: string
 *                 enum: [CND_SEGREGATED, CND_UNSEGREGATED]
 *               estimatedWeight:
 *                 type: number
 *                 minimum: 0
 *                 exclusiveMinimum: true
 *               estimatedVolume:
 *                 type: number
 *                 minimum: 0
 *                 exclusiveMinimum: true
 *               wasteDescription:
 *                 type: string
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               companyId:
 *                 type: string
 *                 format: uuid
 *               plantId:
 *                 type: string
 *                 format: uuid
 *               pickupAddress:
 *                 type: string
 *                 minLength: 5
 *               pickupCity:
 *                 type: string
 *                 minLength: 2
 *               pickupState:
 *                 type: string
 *                 minLength: 2
 *               pickupPincode:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *               pickupLatitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               pickupLongitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               driverName:
 *                 type: string
 *               driverPhone:
 *                 type: string
 *                 pattern: '^\+?[1-9]\d{9,14}$'
 *               vehicleNumber:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *                 pattern: '^[A-Z]{2}\d{2}\d{4}\d{7}$'
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Permit created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — no access to the project
 *       404:
 *         description: Project or plant not found
 */
export async function POST(request: NextRequest) {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;
        const body = await request.json();

        // Validate input
        const validation = createPermitSchema.safeParse(body);
        if (!validation.success) {
            log.error("ZOD ERROR:", validation.error.format());
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const data = validation.data;
        const validFrom = parsePermitDateTime(data.validFrom);
        const validUntil = parsePermitDateTime(data.validUntil);

        const fieldErrors: Record<string, string[]> = {};

        if (Number.isNaN(validFrom.getTime())) {
            fieldErrors.validFrom = ['Invalid start date/time'];
        }

        if (Number.isNaN(validUntil.getTime())) {
            fieldErrors.validUntil = ['Invalid end date/time'];
        }

        if (Object.keys(fieldErrors).length > 0) {
            return createErrorResponse(
                CommonErrors.validationError(fieldErrors)
            );
        }

        let project = null

        // Verify project if provided
        if (data.projectId) {
            project = await prisma.project.findUnique({
                where: { id: data.projectId },
                include: { company: true },
            });

            if (!project) {
                return createErrorResponse(CommonErrors.notFound('Project'));
            }

            // Non-admins must have access to the project (be part of the company)
            if (user.role !== 'ADMIN' && user.companyId !== project.companyId) {
                return createErrorResponse(
                    CommonErrors.forbidden('You do not have access to this project')
                );
            }
        }

        // Verify plant exists
        const plant = await prisma.plant.findUnique({
            where: { id: data.plantId },
        });

        if (!plant) {
            return createErrorResponse(CommonErrors.notFound('Plant'));
        }

        // Create permit
        const permit = await prisma.permit.create({
            data: {
                permitNumber: generatePermitNumber(),

                wasteType: data.wasteType,
                estimatedWeight: data.estimatedWeight ?? null,
                estimatedVolume: data.estimatedVolume ?? null,
                wasteDescription: data.wasteDescription ?? null,
                projectId: data.projectId ?? null,
                companyId:
                    user.role === 'COMPANY_USER'
                        ? user.companyId
                        : data.projectId
                            ? project?.companyId ?? null
                            : null,

                plantId: data.plantId,

                pickupAddress: data.pickupAddress,
                pickupCity: data.pickupCity,
                pickupState: data.pickupState,
                pickupPincode: data.pickupPincode,

                driverName: data.driverName ?? null,
                driverPhone: data.driverPhone ?? null,
                licenseNumber: data.licenseNumber ?? null,
                vehicleNumber: data.vehicleNumber ?? null,
                vehicleType: data.vehicleType ?? null,

                validFrom,
                validUntil,

                userId: user.userId,
                status: mode === 'draft' ? 'DRAFT' : 'SUBMITTED',
            },
            include: {
                project: { select: { id: true, name: true } },
                plant: { select: { id: true, name: true, code: true } },
            },
        });


        // Create audit log
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: permit.id,
            action: 'CREATED',
            performedByUserId: user.userId,
            newState: { permitNumber: permit.permitNumber, status: permit.status },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(permit, undefined, 201);
    } catch (error) {
        log.error('Create permit error:', error);
        return createErrorResponse(error);
    }
}
