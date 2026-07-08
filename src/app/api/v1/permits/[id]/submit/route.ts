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
import { submitPermitSchema, approvePermitSchema } from '@/schemas';
import { sendTemplateNotification } from '@/lib/services/notificationOrchestrator';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/v1/permits/{id}/submit:
 *   post:
 *     summary: Submit a permit for approval
 *     description: Transitions a DRAFT permit to SUBMITTED status with driver/vehicle details.
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
 *             required:
 *               - driverName
 *               - driverPhone
 *               - vehicleNumber
 *             properties:
 *               driverName:
 *                 type: string
 *                 minLength: 2
 *               driverPhone:
 *                 type: string
 *                 pattern: '^\+?[1-9]\d{9,14}$'
 *               vehicleNumber:
 *                 type: string
 *                 minLength: 4
 *               vehicleType:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permit submitted
 *       400:
 *         description: Validation error or permit not in DRAFT status
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
        const body = await request.json();

        // Validate input
        const validation = submitPermitSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        // Get existing permit
        const existingPermit = await prisma.permit.findUnique({
            where: { id },
            include: { project: { select: { companyId: true } } },
        });

        if (!existingPermit) {
            return createErrorResponse(CommonErrors.notFound('Permit'));
        }

        // Check ownership
        if (existingPermit.userId !== user.userId && user.role !== 'ADMIN') {
            if (user.companyId !== existingPermit?.project?.companyId) {
                return createErrorResponse(
                    CommonErrors.forbidden('You do not have access to this permit')
                );
            }
        }

        // Can only submit DRAFT permits
        if (existingPermit.status !== 'DRAFT') {
            return createErrorResponse(
                CommonErrors.badRequest('Can only submit permits in DRAFT status')
            );
        }

        const data = validation.data;

        // Update permit to SUBMITTED
        const permit = await prisma.permit.update({
            where: { id },
            data: {
                ...data,
                status: 'SUBMITTED',
                submittedAt: new Date(),
                updatedByUserId: user.userId,
            },
            include: {
                project: { select: { id: true, name: true } },
                plant: { select: { id: true, name: true, code: true } },
                user: { select: { id: true, name: true, phone: true } },
            },
        });

        // // Trigger notification (Async)
        // if (permit.user?.phone) {
        //     sendTemplateNotification({
        //         eventType: 'PERMIT_SUBMITTED',
        //         userId: permit.userId,
        //         phone: permit.user.phone,
        //         permitId: permit.id,
        //         data: {
        //             permitNumber: permit.permitNumber,
        //             applicantName: permit.user.name
        //         }
        //     });
        // }

        // Create audit log
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: permit.id,
            action: 'SUBMITTED',
            performedByUserId: user.userId,
            previousState: { status: existingPermit.status },
            newState: { status: permit.status },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(permit);
    } catch (error) {
        log.error('Submit permit error:', error);
        return createErrorResponse(error);
    }
}
