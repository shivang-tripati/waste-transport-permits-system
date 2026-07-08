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
import { approvePermitSchema } from '@/schemas';
import { sendTemplateNotification } from '@/lib/services/notificationOrchestrator';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/v1/permits/{id}/approve:
 *   post:
 *     summary: Approve a permit
 *     description: >
 *       Approves a SUBMITTED or UNDER_REVIEW permit with validity period.
 *       Requires `permit:approve` permission.
 *     tags:
 *       - Permits
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 description: Defaults to current time if not provided
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 description: Required — must be after validFrom
 *     responses:
 *       200:
 *         description: Permit approved
 *       400:
 *         description: Validation error or invalid permit status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires permit:approve permission
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
        if (!hasPermission(user.role, 'permit:approve')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to approve permits')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = approvePermitSchema.safeParse(body);
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

        // Can only approve SUBMITTED or UNDER_REVIEW permits
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(existingPermit.status)) {
            return createErrorResponse(
                CommonErrors.badRequest('Can only approve permits in SUBMITTED or UNDER_REVIEW status')
            );
        }

        const data = validation.data;

        // Set default validity (24 hours from now if not specified)
        const validFrom = data.validFrom ? new Date(data.validFrom) : new Date();
        if (!data.validUntil) {
            return createErrorResponse(CommonErrors.badRequest('Permit expiry time is required'));
        }
        const validUntil = new Date(data.validUntil);

        // Validate validity period
        if (validUntil <= validFrom) {
            return createErrorResponse(
                CommonErrors.badRequest('Permit expiry time must be after permit start time')
            );
        }

        // Update permit to APPROVED
        const permit = await prisma.permit.update({
            where: { id },
            data: {
                status: 'APPROVED',
                validFrom,
                validUntil,
                approvedByUserId: user.userId,
                approvedAt: new Date(),
                updatedByUserId: user.userId,
            },
            include: {
                project: { select: { id: true, name: true } },
                plant: { select: { id: true, name: true, code: true } },
                user: { select: { id: true, name: true, phone: true, email: true } },
                approvedBy: { select: { id: true, name: true } },
            },
        });

         // Trigger notification (fire-and-forget — do NOT await)
        if (permit.user?.phone) {
            sendTemplateNotification({
                eventType:   'PERMIT_APPROVED',
                userId:      permit.userId,
                phone:       permit.user.phone,
                permitId:    permit.id,
                driverPhone: permit.driverPhone ?? null,   // <-- added
                userEmail:   permit.user.email ?? null,    // <-- added (email fallback)
                data: {
                    permitNumber: permit.permitNumber,
                    validUntil:   permit.validUntil?.toLocaleDateString('en-IN') ?? '',
                },
            });
        }

        // Create audit log
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: permit.id,
            action: 'APPROVED',
            performedByUserId: user.userId,
            previousState: { status: existingPermit.status },
            newState: { status: permit.status, validFrom, validUntil },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(permit);
    } catch (error) {
        log.error('Approve permit error:', error);
        return createErrorResponse(error);
    }
}
