
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { updateProfileSchema } from '@/schemas';

/**
 * @swagger
 * /api/v1/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information.
 *     tags:
 *       - Profile
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user: authUser } = authResult;

        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            include: {
                company: true,
                identityDocuments: true,
            },
        });

        if (!user) {
            return createErrorResponse(CommonErrors.notFound('User'));
        }

        // Remove sensitive info
        const { passwordHash, ...safeUser } = user;

        return createSuccessResponse(safeUser);
    } catch (error) {
        console.error('Get profile error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/profile:
 *   patch:
 *     summary: Update current user profile
 *     description: Updates basic profile information (name, phone) for the authenticated user.
 *     tags:
 *       - Profile
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
 *               phone:
 *                 type: string
 *                 pattern: '^\+?[1-9]\d{9,14}$'
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export async function PATCH(request: NextRequest) {
    try {
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user: authUser } = authResult;
        const body = await request.json();

        const validation = updateProfileSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const data = validation.data;

        const updatedUser = await prisma.user.update({
            where: { id: authUser.userId },
            data,
            include: {
                company: true,
                identityDocuments: true,
            },
        });

        const { passwordHash, ...safeUser } = updatedUser;

        // Audit log
        await createAuditLog({
            entityType: 'USER',
            entityId: authUser.userId,
            action: 'UPDATED',
            performedByUserId: authUser.userId,
            newState: data,
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(safeUser);
    } catch (error) {
        console.error('Update profile error:', error);
        return createErrorResponse(error);
    }
}
