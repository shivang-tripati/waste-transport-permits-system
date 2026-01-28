import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { updateWeighmentSchema, approveWeighmentSchema, markWeighmentPaidSchema } from '@/schemas';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Check permission
        if (!hasPermission(user.role, 'weighment:read')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to view weighments')
            );
        }

        const weighment = await prisma.weighment.findUnique({
            where: { id },
            include: {
                permit: {
                    select: {
                        id: true,
                        permitNumber: true,
                        status: true,
                        driverName: true,
                        driverPhone: true,
                        vehicleNumber: true,
                        wasteType: true,
                        project: {
                            select: { id: true, name: true, address: true, city: true },
                        },
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
                plant: { select: { id: true, name: true, code: true, address: true, city: true } },
                approvedBy: { select: { id: true, name: true } },
                paidBy: { select: { id: true, name: true } },
            },
        });

        if (!weighment) {
            return createErrorResponse(CommonErrors.notFound('Weighment'));
        }

        return createSuccessResponse(weighment);
    } catch (error) {
        console.error('Get weighment error:', error);
        return createErrorResponse(error);
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Check permission
        if (!hasPermission(user.role, 'weighment:update')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to update weighments')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = updateWeighmentSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        // Check weighment exists
        const existing = await prisma.weighment.findUnique({
            where: { id },
        });

        if (!existing) {
            return createErrorResponse(CommonErrors.notFound('Weighment'));
        }

        // Can only update PENDING weighments
        if (existing.status !== 'PENDING') {
            return createErrorResponse(
                CommonErrors.badRequest('Can only update weighments in PENDING status')
            );
        }

        const data = validation.data;

        // Calculate net weight
        const grossWeight = data.grossWeight ?? existing.grossWeight;
        const tareWeight = data.tareWeight ?? existing.tareWeight;
        const netWeight = grossWeight && tareWeight ? grossWeight - tareWeight : null;

        // Update weighment
        const weighment = await prisma.weighment.update({
            where: { id },
            data: {
                ...data,
                netWeight,
                updatedByUserId: user.userId,
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
            action: 'UPDATED',
            performedByUserId: user.userId,
            previousState: { grossWeight: existing.grossWeight, tareWeight: existing.tareWeight },
            newState: data,
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(weighment);
    } catch (error) {
        console.error('Update weighment error:', error);
        return createErrorResponse(error);
    }
}
