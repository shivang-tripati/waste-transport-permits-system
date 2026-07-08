import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import {log} from '@/lib/logger';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/v1/permits/{id}/complete:
 *   post:
 *     summary: Complete a permit
 *     description: >
 *       Marks an IN_TRANSIT permit as COMPLETED. Requires at least one
 *       weighment record. Requires `permit:update` permission.
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
 *         description: Permit completed
 *       400:
 *         description: Not IN_TRANSIT or missing weighment
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

        // Check permission
        if (!hasPermission(user.role, 'permit:update')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to update permits')
            );
        }

        // Get existing permit
        const existingPermit = await prisma.permit.findUnique({
            where: { id },
            include: { weighments: true }
        });

        if (!existingPermit) {
            return createErrorResponse(CommonErrors.notFound('Permit'));
        }

        // Can only complete permits from IN_TRANSIT
        if (existingPermit.status !== 'IN_TRANSIT') {
            return createErrorResponse(
                CommonErrors.badRequest('Can only complete permits in IN_TRANSIT status')
            );
        }

        // At least one weighment should exist to complete? 
        // Requirements say once permits approved, weighment happens and then mark completed.
        if (existingPermit.weighments.length === 0) {
            return createErrorResponse(
                CommonErrors.badRequest('Permit must have at least one weighment record to be completed')
            );
        }

        // Update permit to COMPLETED
        const permit = await prisma.permit.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                completedByUserId: user.userId,
                updatedByUserId: user.userId,
            },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: permit.id,
            action: 'COMPLETED',
            performedByUserId: user.userId,
            previousState: { status: existingPermit.status },
            newState: { status: permit.status, completedAt: permit.completedAt },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(permit);
    } catch (error) {
        log.error('Complete permit error:', error);
        return createErrorResponse(error);
    }
}
