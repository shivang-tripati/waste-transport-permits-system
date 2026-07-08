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
import { updateCompanySchema } from '@/schemas';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/v1/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     description: Returns a single company with project counts. Non-admins can only view their own company.
 *     tags:
 *       - Companies
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Company details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Company not found
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

        // Non-admins can only view their own company
        if (!hasPermission(user.role, 'company:read') && user.companyId !== id) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have access to this company')
            );
        }

        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                _count: { select: { users: true, projects: true } },
                projects: {
                    where: { isActive: true },
                    select: { id: true, name: true, city: true },
                },
            },
        });

        if (!company) {
            return createErrorResponse(CommonErrors.notFound('Company'));
        }

        return createSuccessResponse(company);
    } catch (error) {
        log.error('Get company error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/companies/{id}:
 *   patch:
 *     summary: Update a company
 *     description: Partially updates a company. Requires `company:update` permission.
 *     tags:
 *       - Companies
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
 *               registrationNumber:
 *                 type: string
 *               gstNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *               contactEmail:
 *                 type: string
 *                 format: email
 *               contactPhone:
 *                 type: string
 *                 pattern: '^\+?[1-9]\d{9,14}$'
 *     responses:
 *       200:
 *         description: Company updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Company not found
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

        // Only admins can update companies
        if (!hasPermission(user.role, 'company:update')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to update companies')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = updateCompanySchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        // Check company exists
        const existing = await prisma.company.findUnique({
            where: { id },
        });

        if (!existing) {
            return createErrorResponse(CommonErrors.notFound('Company'));
        }

        const data = validation.data;

        // Update company
        const company = await prisma.company.update({
            where: { id },
            data,
        });

        // Create audit log
        await createAuditLog({
            entityType: 'COMPANY',
            entityId: company.id,
            action: 'UPDATED',
            performedByUserId: user.userId,
            previousState: { name: existing.name },
            newState: data,
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(company);
    } catch (error) {
        log.error('Update company error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/companies/{id}:
 *   delete:
 *     summary: Deactivate a company
 *     description: Soft-deletes a company by setting `isActive` to false. Requires `company:delete` permission.
 *     tags:
 *       - Companies
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Company deactivated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Company not found
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

        // Only admins can delete companies
        if (!hasPermission(user.role, 'company:delete')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to delete companies')
            );
        }

        // Check company exists
        const existing = await prisma.company.findUnique({
            where: { id },
            include: { _count: { select: { users: true, projects: true } } },
        });

        if (!existing) {
            return createErrorResponse(CommonErrors.notFound('Company'));
        }

        // Soft delete - deactivate instead of hard delete
        const company = await prisma.company.update({
            where: { id },
            data: { isActive: false },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'COMPANY',
            entityId: company.id,
            action: 'DELETED',
            performedByUserId: user.userId,
            previousState: { name: existing.name, isActive: true },
            newState: { isActive: false },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse({ message: 'Company deactivated successfully' });
    } catch (error) {
        log.error('Delete company error:', error);
        return createErrorResponse(error);
    }
}
