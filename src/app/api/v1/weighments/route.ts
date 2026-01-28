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
import { createWeighmentSchema } from '@/schemas';
import { generateWeighmentNumber } from '@/lib/utils';
import { Prisma } from '@prisma/client';

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'status', 'weighedAt'];

export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Only admins and plant operators can list all weighments
        if (!hasPermission(user.role, 'weighment:read')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to view weighments')
            );
        }

        const { searchParams } = new URL(request.url);
        const { page, limit, skip } = parsePagination(searchParams);
        const { field: sortField, order: sortOrder } = parseSort(searchParams, SORTABLE_FIELDS);

        const where: Prisma.WeighmentWhereInput = {};

        // Filter by status
        const status = searchParams.get('status');
        if (status) {
            where.status = status as Prisma.EnumWeighmentStatusFilter['equals'];
        }

        // Filter by payment status
        const paymentStatus = searchParams.get('paymentStatus');
        if (paymentStatus) {
            where.paymentStatus = paymentStatus as Prisma.EnumPaymentStatusFilter['equals'];
        }

        // Filter by plant
        const plantId = searchParams.get('plantId');
        if (plantId) {
            where.plantId = plantId;
        }

        // Filter by permit
        const permitId = searchParams.get('permitId');
        if (permitId) {
            where.permitId = permitId;
        }

        // Search by weighment number
        const search = searchParams.get('search');
        if (search) {
            where.weighmentNumber = { contains: search, mode: 'insensitive' };
        }

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
                            vehicleNumber: true,
                        },
                    },
                    plant: { select: { id: true, name: true, code: true } },
                    approvedBy: { select: { id: true, name: true } },
                    paidBy: { select: { id: true, name: true } },
                },
            }),
            prisma.weighment.count({ where }),
        ]);

        return createSuccessResponse(weighments, createPaginationMeta(page, limit, total));
    } catch (error) {
        console.error('List weighments error:', error);
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

        // Only admins can create weighments
        if (!hasPermission(user.role, 'weighment:create')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to create weighments')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = createWeighmentSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const data = validation.data;

        // Verify permit exists and is in valid state
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

        // Calculate net weight if both gross and tare provided
        const netWeight = data.grossWeight && data.tareWeight
            ? data.grossWeight - data.tareWeight
            : null;

        // Create weighment
        const weighment = await prisma.weighment.create({
            data: {
                weighmentNumber: generateWeighmentNumber(),
                permitId: data.permitId,
                plantId: data.plantId,
                grossWeight: data.grossWeight,
                tareWeight: data.tareWeight,
                netWeight,
                notes: data.notes,
                weighedAt: new Date(),
            },
            include: {
                permit: { select: { id: true, permitNumber: true } },
                plant: { select: { id: true, name: true, code: true } },
            },
        });

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
        console.error('Create weighment error:', error);
        return createErrorResponse(error);
    }
}
