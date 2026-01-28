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
