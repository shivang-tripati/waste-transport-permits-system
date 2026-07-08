import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission, isAdmin } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import  {log} from '@/lib/logger';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { updateProjectSchema } from '@/schemas';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Returns a single project with company info and permit count.
 *     tags:
 *       - Projects
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
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

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                company: { select: { id: true, name: true } },
                _count: { select: { permits: true } },
            },
        });

        if (!project) {
            return createErrorResponse(CommonErrors.notFound('Project'));
        }

        // Non-admins can only view their company's projects
        if (!isAdmin(user.role) && user.companyId !== project.companyId) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have access to this project')
            );
        }

        return createSuccessResponse(project);
    } catch (error) {
        log.error('Get project error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   patch:
 *     summary: Update a project
 *     description: Partially updates a project. Requires `project:update` permission.
 *     tags:
 *       - Projects
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
 *               description:
 *                 type: string
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
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *     responses:
 *       200:
 *         description: Project updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
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

        // Only admins can update projects
        if (!hasPermission(user.role, 'project:update')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to update projects')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = updateProjectSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        // Check project exists
        const existing = await prisma.project.findUnique({
            where: { id },
        });

        if (!existing) {
            return createErrorResponse(CommonErrors.notFound('Project'));
        }

        const data = validation.data;

        // Update project
        const project = await prisma.project.update({
            where: { id },
            data,
            include: {
                company: { select: { id: true, name: true } },
            },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PROJECT',
            entityId: project.id,
            action: 'UPDATED',
            performedByUserId: user.userId,
            previousState: { name: existing.name },
            newState: data,
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(project);
    } catch (error) {
        log.error('Update project error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   delete:
 *     summary: Deactivate a project
 *     description: Soft-deletes a project. Requires `project:delete` permission.
 *     tags:
 *       - Projects
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project deactivated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
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

        // Only admins can delete projects
        if (!hasPermission(user.role, 'project:delete')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to delete projects')
            );
        }

        // Check project exists
        const existing = await prisma.project.findUnique({
            where: { id },
        });

        if (!existing) {
            return createErrorResponse(CommonErrors.notFound('Project'));
        }

        // Soft delete
        const project = await prisma.project.update({
            where: { id },
            data: { isActive: false },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PROJECT',
            entityId: project.id,
            action: 'DELETED',
            performedByUserId: user.userId,
            previousState: { name: existing.name, isActive: true },
            newState: { isActive: false },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse({ message: 'Project deactivated successfully' });
    } catch (error) {
        log.error('Delete project error:', error);
        return createErrorResponse(error);
    }
}
