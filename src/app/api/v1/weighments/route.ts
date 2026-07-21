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
import { log } from '@/lib/logger';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { createWeighmentSchema, updateWeighmentSchema, approveWeighmentSchema, markWeighmentPaidSchema } from '@/schemas';
import { generateWeighmentNumber } from '@/lib/utils';
import { sendTemplateNotification } from '@/lib/services/notificationOrchestrator';
import { Prisma } from '@prisma/client';

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'status', 'weighedAt'];

/**
 * @swagger
 * /api/v1/weighments:
 *   get:
 *     summary: List weighments
 *     description: >
 *       Returns paginated weighment records. Admins/Plant Operators see all;
 *       regular users see only their own APPROVED weighments.
 *     tags:
 *       - Weighments
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
 *           enum: [createdAt, updatedAt, status, weighedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, FAILED, REFUNDED]
 *       - in: query
 *         name: plantId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: permitId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by weighment number
 *     responses:
 *       200:
 *         description: Paginated list of weighments
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
        const { page, limit, skip } = parsePagination(searchParams);
        const { field: sortField, order: sortOrder } = parseSort(searchParams, SORTABLE_FIELDS);

        // ✅ Build where clause based on role - same pattern as permits
        const where: Prisma.WeighmentWhereInput = {};

        // ✅ Non-admins can only see their own weighments (or company weighments)
        if (user.role !== 'ADMIN') {
            if (user.companyId) {
                // ✅ Company users can see weighments for their company's projects
                where.permit = {
                    project: { companyId: user.companyId }
                };
            } else {
                // ✅ Individual users can only see their own permit weighments
                where.permit = { userId: user.userId };
            }
        }

        // ✅ Apply filters (same for all roles)
        const status = searchParams.get('status');
        if (status) {
            where.status = status as Prisma.EnumWeighmentStatusFilter['equals'];
        }

        const paymentStatus = searchParams.get('paymentStatus');
        if (paymentStatus) {
            where.paymentStatus = paymentStatus as Prisma.EnumPaymentStatusFilter['equals'];
        }

        const plantId = searchParams.get('plantId');
        if (plantId) {
            where.plantId = plantId;
        }

        const permitId = searchParams.get('permitId');
        if (permitId) {
            where.permitId = permitId;
        }

        // Search by weighment number
        const search = searchParams.get('search');
        if (search) {
            where.weighmentNumber = { contains: search, mode: 'insensitive' };
        }

        // ✅ Query with the same include structure as permits
        const [weighments, total] = await Promise.all([
            prisma.weighment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder },
                include: {
                    permit: {
                        select: {
                            id: true,
                            permitNumber: true,
                            status: true,
                            driverName: true,
                            driverPhone: true,
                            vehicleNumber: true,
                            vehicleType: true,
                            user: {
                                select: { id: true, name: true, email: true },
                            },
                            project: {
                                select: { id: true, name: true, address: true, city: true },
                            },
                        },
                    },
                    plant: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            address: true,
                            city: true,
                        }
                    },
                    approvedBy: { select: { id: true, name: true } },
                    paidBy: { select: { id: true, name: true } },
                },
            }),
            prisma.weighment.count({ where }),
        ]);

        return createSuccessResponse(weighments, createPaginationMeta(page, limit, total));
    } catch (error) {
        log.error('List weighments error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/weighments:
 *   post:
 *     summary: Create a weighment record
 *     description: >
 *       Creates a new weighment for an IN_TRANSIT permit.
 *       Admin/Plant Operator only.
 *     tags:
 *       - Weighments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permitId
 *               - plantId
 *             properties:
 *               permitId:
 *                 type: string
 *                 format: uuid
 *               plantId:
 *                 type: string
 *                 format: uuid
 *               firstWeight:
 *                 type: number
 *                 minimum: 0
 *               secondWeight:
 *                 type: number
 *                 minimum: 0
 *               firstWeighmentAt:
 *                 type: string
 *                 format: date-time
 *               secondWeighmentAt:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Weighment created
 *       400:
 *         description: Validation error or permit not IN_TRANSIT
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Permit or plant not found
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Only admins can create weighments
        if (!hasPermission(user.role, 'weighment:create')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to create weighments')
            );
        }

        const body = await request.json();
        log.info("BODY:", body)

        // Validate input
        const validation = createWeighmentSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const data = validation.data;

        // Permit Verification exists and is in valid state
        const permit = await prisma.permit.findUnique({
            where: { id: data.permitId },
        });

        if (!permit) {
            return createErrorResponse(CommonErrors.notFound('Permit'));
        }

        // Permit must be IN_TRANSIT to create weighment
        if (permit.status !== 'IN_TRANSIT') {
            return createErrorResponse(
                CommonErrors.badRequest('Permit must be IN_TRANSIT to create weighment')
            );
        }

        // Verify plant exists
        const plant = await prisma.plant.findUnique({
            where: { id: data.plantId },
        });

        if (!plant) {
            return createErrorResponse(CommonErrors.notFound('Plant'));
        }

        // Calculate net weight
        const firstWeight = data.firstWeight ?? null;
        const secondWeight = data.secondWeight ?? null;
        const firstWeighmentAt = data.firstWeighmentAt ?? null;
        const secondWeighmentAt = data.secondWeighmentAt ?? null;
        let netWeight = null;
        if (firstWeight !== null && secondWeight !== null) {
            netWeight = Math.abs(secondWeight - firstWeight);
        }

        // Create weighment
        const weighment = await prisma.weighment.create({
            data: {
                weighmentNumber: generateWeighmentNumber(),
                permitId: data.permitId,
                plantId: data.plantId,
                firstWeight,
                firstWeighmentAt,
                secondWeight,
                secondWeighmentAt,
                netWeight,
                // fileUrl: data.fileUrl ?? null, // Note: fileUrl is not in createWeighmentSchema currently, adding to schema might be needed or handled here if it's sent
                notes: data.notes,
                weighedAt: new Date().toISOString(),
            },
            include: {
                permit: {
                    select: {
                        id: true,
                        permitNumber: true,
                        userId: true,
                        user: { select: { phone: true } }
                    }
                },
                plant: { select: { id: true, name: true, code: true } },
            },
        });

        // // Trigger notification (Async) - only if netWeight is calculated
        // if (weighment.netWeight !== null && weighment.permit?.user?.phone) {
        //     sendTemplateNotification({
        //         eventType: 'WEIGHMENT_RECORDED',
        //         userId: weighment.permit.userId,
        //         phone: weighment.permit.user.phone,
        //         permitId: weighment.permitId,
        //         data: {
        //             permitNumber: weighment.permit.permitNumber,
        //             netWeight: `${weighment.netWeight} kg`,
        //             plantName: weighment.plant.name
        //         }
        //     });
        // }

        // Create audit log
        await createAuditLog({
            entityType: 'WEIGHMENT',
            entityId: weighment.id,
            action: 'CREATED',
            performedByUserId: user.userId,
            newState: {
                weighmentNumber: weighment.weighmentNumber,
                permitId: weighment.permitId,
                netWeight,
            },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(weighment, undefined, 201);
    } catch (error) {
        log.error('Create weighment error:', error);
        return createErrorResponse(error);
    }
}
