import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, canAccessResource, isAdmin } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import {log} from '@/lib/logger';
import { updatePermitSchema } from '@/schemas';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/v1/permits/{id}:
 *   get:
 *     summary: Get permit by ID
 *     description: Returns full permit details with project, plant, user, evidences, weighments, and audit info.
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
 *         description: Permit details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Permit not found
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Get permit with relations
        const permit = await prisma.permit.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        city: true,
                        state: true,
                        company: { select: { id: true, name: true } },
                    },
                },
                plant: {
                    select: { id: true, name: true, code: true, address: true, city: true },
                },
                user: {
                    select: { id: true, name: true, email: true, phone: true },
                },
                wasteEvidences: true,
                weighments: {
                    include: {
                        plant: { select: { id: true, name: true, code: true } },
                    },
                },
                approvedBy: { select: { id: true, name: true } },
                rejectedBy: { select: { id: true, name: true } },
                cancelledBy: { select: { id: true, name: true } },
                completedBy: { select: { id: true, name: true } },
            },
        });

        if (!permit) {
            return createErrorResponse(CommonErrors.notFound('Permit'));
        }

        const companyId = permit.project?.company?.id;

        // Check access permission
        if (!isAdmin(user.role)) {
            const hasAccess = canAccessResource(
                user,
                {
                    userId: permit.userId,
                    companyId
                },
                true
            );

            if (!hasAccess) {
                return createErrorResponse(
                    CommonErrors.forbidden('You do not have access to this permit')
                );
            }
        }

        return createSuccessResponse(permit);
    } catch (error) {
        log.error('Get permit error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/permits/{id}:
 *   patch:
 *     summary: Update a permit
 *     description: Partially updates a DRAFT permit. Only the permit owner or admin can update.
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
 *               wasteType:
 *                 type: string
 *                 enum: [CND_SEGREGATED, CND_UNSEGREGATED]
 *               estimatedWeight:
 *                 type: number
 *               estimatedVolume:
 *                 type: number
 *               wasteDescription:
 *                 type: string
 *               pickupAddress:
 *                 type: string
 *               pickupCity:
 *                 type: string
 *               pickupState:
 *                 type: string
 *               pickupPincode:
 *                 type: string
 *               driverName:
 *                 type: string
 *               driverPhone:
 *                 type: string
 *               vehicleNumber:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Permit updated
 *       400:
 *         description: Validation error or permit not in DRAFT status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Permit not found
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
        const validation = updatePermitSchema.safeParse(body);
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

        // Check access permission
        if (!isAdmin(user.role)) {
            const hasAccess = canAccessResource(
                user,
                { userId: existingPermit.userId, companyId: existingPermit.project?.companyId },
                true
            );

            if (!hasAccess) {
                return createErrorResponse(
                    CommonErrors.forbidden('You do not have access to this permit')
                );
            }
        }

        // Can only update DRAFT permits
        if (existingPermit.status !== 'DRAFT') {
            return createErrorResponse(
                CommonErrors.badRequest('Can only update permits in DRAFT status')
            );
        }

        const data = validation.data;

        // Update permit
        const permit = await prisma.permit.update({
            where: { id },
            data: {
                ...data,
                validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
                validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
                updatedByUserId: user.userId,
            },
            include: {
                project: { select: { id: true, name: true } },
                plant: { select: { id: true, name: true, code: true } },
            },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: permit.id,
            action: 'UPDATED',
            performedByUserId: user.userId,
            previousState: { status: existingPermit.status },
            newState: data,
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(permit);
    } catch (error) {
        log.error('Update permit error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/permits/{id}:
 *   delete:
 *     summary: Delete a permit
 *     description: Permanently deletes a DRAFT or CANCELLED permit. Admin only.
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
 *         description: Permit deleted
 *       400:
 *         description: Permit not in DRAFT or CANCELLED status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin only
 *       404:
 *         description: Permit not found
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Only admins can delete
        if (!isAdmin(user.role)) {
            return createErrorResponse(
                CommonErrors.forbidden('Only administrators can delete permits')
            );
        }

        // Get existing permit
        const existingPermit = await prisma.permit.findUnique({
            where: { id },
        });

        if (!existingPermit) {
            return createErrorResponse(CommonErrors.notFound('Permit'));
        }

        // Can only delete DRAFT or CANCELLED permits
        if (!['DRAFT', 'CANCELLED'].includes(existingPermit.status)) {
            return createErrorResponse(
                CommonErrors.badRequest('Can only delete permits in DRAFT or CANCELLED status')
            );
        }

        // Delete permit
        await prisma.permit.delete({
            where: { id },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: id,
            action: 'DELETED',
            performedByUserId: user.userId,
            previousState: { permitNumber: existingPermit.permitNumber, status: existingPermit.status },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse({ message: 'Permit deleted successfully' });
    } catch (error) {
        log.error('Delete permit error:', error);
        return createErrorResponse(error);
    }
}
