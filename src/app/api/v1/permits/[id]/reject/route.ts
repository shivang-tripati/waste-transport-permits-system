import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { rejectPermitSchema } from '@/schemas';

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
        if (!hasPermission(user.role, 'permit:reject')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to reject permits')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = rejectPermitSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        // Get existing permit
        const existingPermit = await prisma.permit.findUnique({
            where: { id },
        });

        if (!existingPermit) {
            return createErrorResponse(CommonErrors.notFound('Permit'));
        }

        // Can only reject SUBMITTED or UNDER_REVIEW permits
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(existingPermit.status)) {
            return createErrorResponse(
                CommonErrors.badRequest('Can only reject permits in SUBMITTED or UNDER_REVIEW status')
            );
        }

        const { reason } = validation.data;

        // Update permit to REJECTED
        const permit = await prisma.permit.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectedByUserId: user.userId,
                rejectedAt: new Date(),
                rejectionReason: reason,
                updatedByUserId: user.userId,
            },
            include: {
                project: { select: { id: true, name: true } },
                plant: { select: { id: true, name: true, code: true } },
                user: { select: { id: true, name: true, email: true } },
                rejectedBy: { select: { id: true, name: true } },
            },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: permit.id,
            action: 'REJECTED',
            performedByUserId: user.userId,
            previousState: { status: existingPermit.status },
            newState: { status: permit.status, rejectionReason: reason },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(permit);
    } catch (error) {
        console.error('Reject permit error:', error);
        return createErrorResponse(error);
    }
}
