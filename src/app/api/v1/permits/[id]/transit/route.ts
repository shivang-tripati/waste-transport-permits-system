import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import {log} from '@/lib/logger';
interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/v1/permits/{id}/transit:
 *   post:
 *     summary: Start transit
 *     description: Transitions an APPROVED permit to IN_TRANSIT status. Requires `permit:update` permission.
 *     tags:
 *       - Permits
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transit started
 *       400:
 *         description: Permit not in APPROVED status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Permit not found
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Check permission - Only admins or authorized users can start transit
        if (!hasPermission(user.role, 'permit:update')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to update permits')
            );
        }

        // Get existing permit
        const existingPermit = await prisma.permit.findUnique({
            where: { id },
        });

        if (!existingPermit) {
            return createErrorResponse(CommonErrors.notFound('Permit'));
        }

        // Can only start transit for APPROVED permits
        if (existingPermit.status !== 'APPROVED') {
            return createErrorResponse(
                CommonErrors.badRequest('Can only start transit for APPROVED permits')
            );
        }

        // Update permit to IN_TRANSIT
        const permit = await prisma.permit.update({
            where: { id },
            data: {
                status: 'IN_TRANSIT',
                transitStartedAt: new Date(),
                updatedByUserId: user.userId,
            },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: permit.id,
            action: 'IN_TRANSIT',
            performedByUserId: user.userId,
            previousState: { status: existingPermit.status },
            newState: { status: permit.status, transitStartedAt: permit.transitStartedAt },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(permit);
    } catch (error) {
        log.error('Start transit error:', error);
        return createErrorResponse(error);
    }
}
