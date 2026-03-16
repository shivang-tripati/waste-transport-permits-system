import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { rejectWeighmentSchema } from '@/schemas';

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

        // Check permission - only admins can reject weighments
        if (!hasPermission(user.role, 'weighment:approve')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to reject weighments')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = rejectWeighmentSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        // Get existing weighment
        const existing = await prisma.weighment.findUnique({
            where: { id },
        });

        if (!existing) {
            return createErrorResponse(CommonErrors.notFound('Weighment'));
        }

        // Can only reject PENDING weighments
        if (existing.status !== 'PENDING') {
            return createErrorResponse(
                CommonErrors.badRequest('Can only reject weighments in PENDING status')
            );
        }

        const { reason } = validation.data;

        // Update weighment to REJECTED
        const weighment = await prisma.weighment.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectionReason: reason,
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
            action: 'REJECTED',
            performedByUserId: user.userId,
            previousState: { status: existing.status },
            newState: { status: weighment.status, rejectionReason: reason },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(weighment);
    } catch (error) {
        console.error('Reject weighment error:', error);
        return createErrorResponse(error);
    }
}
