import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { approveWeighmentSchema } from '@/schemas';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Check permission
        if (!hasPermission(user.role, 'weighment:approve')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to approve weighments')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = approveWeighmentSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        // Get existing weighment
        const existing = await prisma.weighment.findUnique({
            where: { id },
            include: { permit: true },
        });

        if (!existing) {
            return createErrorResponse(CommonErrors.notFound('Weighment'));
        }

        // Can only approve PENDING weighments
        if (existing.status !== 'PENDING') {
            return createErrorResponse(
                CommonErrors.badRequest('Can only approve weighments in PENDING status')
            );
        }

        const { paymentAmount, paymentMethod } = validation.data;

        // Update weighment to APPROVED and update permit to COMPLETED
        const [weighment] = await prisma.$transaction([
            prisma.weighment.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    paymentAmount,
                    paymentMethod,
                    approvedByUserId: user.userId,
                    approvedAt: new Date(),
                    updatedByUserId: user.userId,
                },
                include: {
                    permit: { select: { id: true, permitNumber: true } },
                    plant: { select: { id: true, name: true, code: true } },
                    approvedBy: { select: { id: true, name: true } },
                },
            }),
            prisma.permit.update({
                where: { id: existing.permitId },
                data: {
                    status: 'COMPLETED',
                    completedByUserId: user.userId,
                    completedAt: new Date(),
                },
            }),
        ]);

        // Create audit log for weighment
        await createAuditLog({
            entityType: 'WEIGHMENT',
            entityId: weighment.id,
            action: 'APPROVED',
            performedByUserId: user.userId,
            previousState: { status: existing.status },
            newState: { status: weighment.status, paymentAmount },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        // Create audit log for permit completion
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: existing.permitId,
            action: 'COMPLETED',
            performedByUserId: user.userId,
            previousState: { status: existing.permit.status },
            newState: { status: 'COMPLETED' },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(weighment);
    } catch (error) {
        console.error('Approve weighment error:', error);
        return createErrorResponse(error);
    }
}
