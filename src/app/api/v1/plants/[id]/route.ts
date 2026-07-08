import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { updatePlantSchema } from '@/schemas';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/v1/plants/{id}:
 *   get:
 *     summary: Get plant by ID
 *     description: Returns a single plant with permit and weighment counts.
 *     tags:
 *       - Plants
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Plant details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Plant not found
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const plant = await prisma.plant.findUnique({
            where: { id },
            include: {
                _count: { select: { permits: true, weighments: true } },
            },
        });

        if (!plant) {
            return createErrorResponse(CommonErrors.notFound('Plant'));
        }

        return createSuccessResponse(plant);
    } catch (error) {
        console.error('Get plant error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/plants/{id}:
 *   patch:
 *     summary: Update a plant
 *     description: Partially updates a plant (code cannot be changed). Admin only.
 *     tags:
 *       - Plants
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
 *               name:
 *                 type: string
 *                 minLength: 2
 *               address:
 *                 type: string
 *                 minLength: 5
 *               city:
 *                 type: string
 *                 minLength: 2
 *               state:
 *                 type: string
 *                 minLength: 2
 *               pincode:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               operatingHours:
 *                 type: string
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Plant updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Plant not found
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

        // Only admins can update plants
        if (!hasPermission(user.role, 'plant:update')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to update plants')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = updatePlantSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        // Check plant exists
        const existing = await prisma.plant.findUnique({
            where: { id },
        });

        if (!existing) {
            return createErrorResponse(CommonErrors.notFound('Plant'));
        }

        const data = validation.data;

        // Update plant
        const plant = await prisma.plant.update({
            where: { id },
            data,
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PLANT',
            entityId: plant.id,
            action: 'UPDATED',
            performedByUserId: user.userId,
            previousState: { name: existing.name },
            newState: data,
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(plant);
    } catch (error) {
        console.error('Update plant error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/plants/{id}:
 *   delete:
 *     summary: Deactivate a plant
 *     description: Soft-deletes a plant. Admin only.
 *     tags:
 *       - Plants
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Plant deactivated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Plant not found
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

        // Only admins can delete plants
        if (!hasPermission(user.role, 'plant:delete')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to delete plants')
            );
        }

        // Check plant exists
        const existing = await prisma.plant.findUnique({
            where: { id },
        });

        if (!existing) {
            return createErrorResponse(CommonErrors.notFound('Plant'));
        }

        // Soft delete
        const plant = await prisma.plant.update({
            where: { id },
            data: { isActive: false },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PLANT',
            entityId: plant.id,
            action: 'DELETED',
            performedByUserId: user.userId,
            previousState: { name: existing.name, isActive: true },
            newState: { isActive: false },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse({ message: 'Plant deactivated successfully' });
    } catch (error) {
        console.error('Delete plant error:', error);
        return createErrorResponse(error);
    }
}
