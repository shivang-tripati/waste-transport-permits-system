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
                    select: { id: true, name: true, email: true, phone: true, role: true },
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

        const companyId =
    permit.companyId ??
    permit.project?.company?.id ??
    undefined;

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
export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        // 1. Authenticate
        const authResult = await authenticate(request);

        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // 2. Find the existing permit before processing update data
        const existingPermit =
            await prisma.permit.findUnique({
                where: { id },
                include: {
                    project: {
                        select: {
                            id: true,
                            companyId: true,
                        },
                    },
                },
            });

        if (!existingPermit) {
            return createErrorResponse(
                CommonErrors.notFound('Permit')
            );
        }

        // 3. Check whether the authenticated user can access it
        const resourceCompanyId =
            existingPermit.companyId ??
            existingPermit.project?.companyId ??
            undefined;

        if (!isAdmin(user.role)) {
            const hasAccess = canAccessResource(
                user,
                {
                    userId: existingPermit.userId,
                    companyId: resourceCompanyId,
                },
                true
            );

            if (!hasAccess) {
                return createErrorResponse(
                    CommonErrors.forbidden(
                        'You do not have access to this permit'
                    )
                );
            }
        }

        // 4. Only DRAFT permits are editable
        if (existingPermit.status !== 'DRAFT') {
            return createErrorResponse(
                CommonErrors.badRequest(
                    'Only draft permits can be edited'
                )
            );
        }

        // 5. Read and validate request data
        const body = await request.json();

        const validation =
            updatePermitSchema.safeParse(body);

        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(
                    validation.error.flatten().fieldErrors
                )
            );
        }

        const data = validation.data;

        /*
         * companyId must not be accepted directly from the client.
         * It is derived from the selected project or preserved from
         * the existing permit.
         */
        const {
            companyId: _ignoredCompanyId,
            projectId,
            plantId,
            validFrom,
            validUntil,
            ...editableFields
        } = data;

        let resolvedProjectCompanyId:
            | string
            | null
            | undefined;

        // 6. Validate a changed project
        if (projectId !== undefined) {
            const project =
                await prisma.project.findUnique({
                    where: {
                        id: projectId,
                    },
                    select: {
                        id: true,
                        companyId: true,
                    },
                });

            if (!project) {
                return createErrorResponse(
                    CommonErrors.notFound('Project')
                );
            }

            /*
             * Non-admin users may only assign projects belonging
             * to their own company.
             */
            if (!isAdmin(user.role)) {
                if (
                    user.role !== 'COMPANY_USER' ||
                    !user.companyId
                ) {
                    return createErrorResponse(
                        CommonErrors.forbidden(
                            'Only company users can assign a project to a permit'
                        )
                    );
                }

                if (
                    project.companyId !== user.companyId
                ) {
                    return createErrorResponse(
                        CommonErrors.forbidden(
                            'You cannot assign a project belonging to another company'
                        )
                    );
                }
            }

            resolvedProjectCompanyId =
                project.companyId;
        }

        // 7. Validate a changed plant
        if (plantId !== undefined) {
            const plant =
                await prisma.plant.findUnique({
                    where: {
                        id: plantId,
                    },
                    select: {
                        id: true,
                        isActive: true,
                    },
                });

            if (!plant) {
                return createErrorResponse(
                    CommonErrors.notFound('Plant')
                );
            }

            if (!plant.isActive) {
                return createErrorResponse(
                    CommonErrors.badRequest(
                        'The selected plant is not active'
                    )
                );
            }
        }

        // 8. Validate date range against both new and existing values
        const nextValidFrom =
            validFrom !== undefined
                ? new Date(validFrom)
                : existingPermit.validFrom;

        const nextValidUntil =
            validUntil !== undefined
                ? new Date(validUntil)
                : existingPermit.validUntil;

        if (
            nextValidFrom &&
            nextValidUntil &&
            nextValidUntil.getTime() <=
                nextValidFrom.getTime()
        ) {
            return createErrorResponse(
                CommonErrors.validationError({
                    validUntil: [
                        'Permit expiry must be after the valid-from date and time',
                    ],
                })
            );
        }

        /*
         * Build the update explicitly.
         *
         * Undefined fields are not written, so PATCH remains a
         * partial-update endpoint.
         */
        const updateData: Record<string, unknown> = {
            ...editableFields,
            updatedByUserId: user.userId,
        };

        if (projectId !== undefined) {
            updateData.projectId = projectId;
            updateData.companyId =
                resolvedProjectCompanyId ?? null;
        }

        if (plantId !== undefined) {
            updateData.plantId = plantId;
        }

        if (validFrom !== undefined) {
            updateData.validFrom =
                new Date(validFrom);
        }

        if (validUntil !== undefined) {
            updateData.validUntil =
                new Date(validUntil);
        }

        // 9. Update the same existing DRAFT permit
        const updatedPermit =
            await prisma.permit.update({
                where: { id },
                data: updateData,
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                            city: true,
                            state: true,
                            company: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    plant: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            address: true,
                            city: true,
                        },
                    },
                    wasteEvidences: true,
                },
            });

        // 10. Record the update
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: updatedPermit.id,
            action: 'UPDATED',
            performedByUserId: user.userId,
            previousState: {
                status: existingPermit.status,
                projectId:
                    existingPermit.projectId,
                plantId:
                    existingPermit.plantId,
                validFrom:
                    existingPermit.validFrom,
                validUntil:
                    existingPermit.validUntil,
            },
            newState: {
                ...data,
                companyId:
                    resolvedProjectCompanyId ??
                    existingPermit.companyId,
            },
            ipAddress: getClientIP(
                request.headers
            ),
            userAgent: getUserAgent(
                request.headers
            ),
        });

        return createSuccessResponse(
            updatedPermit
        );
    } catch (error) {
        log.error(
            'Update permit error:',
            error
        );

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