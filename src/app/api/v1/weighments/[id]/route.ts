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
import { sendTemplateNotification } from '@/lib/services/notificationOrchestrator';

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

        // Calculate net weight and handle timestamps
        const firstWeight = data.grossWeight ?? existing.firstWeight;
        const secondWeight = data.tareWeight ?? existing.secondWeight;
        let netWeight = null;
        if (firstWeight !== null && secondWeight !== null) {
            netWeight = Math.abs(secondWeight - firstWeight);
        }

        const updateData: any = {
            ...data,
            firstWeight,
            secondWeight,
            netWeight,
            updatedByUserId: user.userId,
        };

        // Update timestamps if weights are new
        if (data.grossWeight !== undefined && data.grossWeight !== null && !existing.firstWeighmentAt) {
            updateData.firstWeighmentAt = new Date();
        }
        if (data.tareWeight !== undefined && data.tareWeight !== null && !existing.secondWeighmentAt) {
            updateData.secondWeighmentAt = new Date();
        }

        // Update weighment
        const weighment = await prisma.weighment.update({
            where: { id },
            data: updateData,
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

        // Trigger notification (Async) - for netWeight or Document upload
        if (weighment.permit?.user?.phone) {
            // Document upload (we handle fileUrl if it's in the data, even if not in schema yet)
            const fileUrl = (data as any).fileUrl;
            if (fileUrl && fileUrl !== existing.fileUrl) {
                sendTemplateNotification({
                    eventType: 'WEIGHMENT_DOCUMENT',
                    userId: weighment.permit.userId,
                    phone: weighment.permit.user.phone,
                    permitId: weighment.permitId,
                    data: {
                        weighmentNumber: weighment.weighmentNumber,
                        docUrl: `${process.env.NEXT_PUBLIC_APP_URL}/uploads/${fileUrl}`
                    }
                });
            }

            // Net weight completed
            if (weighment.netWeight !== null && existing.netWeight === null) {
                sendTemplateNotification({
                    eventType: 'WEIGHMENT_RECORDED',
                    userId: weighment.permit.userId,
                    phone: weighment.permit.user.phone,
                    permitId: weighment.permitId,
                    data: {
                        permitNumber: weighment.permit.permitNumber,
                        netWeight: `${weighment.netWeight} kg`,
                        plantName: weighment.plant.name
                    }
                });
            }
        }

        // Create audit log
        await createAuditLog({
            entityType: 'WEIGHMENT',
            entityId: weighment.id,
            action: 'UPDATED',
            performedByUserId: user.userId,
            previousState: {
                firstWeight: existing.firstWeight,
                secondWeight: existing.secondWeight,
                fileUrl: existing.fileUrl
            },
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
