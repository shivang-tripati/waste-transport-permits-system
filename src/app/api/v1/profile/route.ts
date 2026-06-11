
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import  {log} from '@/lib/logger';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { updateProfileSchema } from '@/schemas';

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
        log.error('Get profile error:', error);
        return createErrorResponse(error);
    }
}

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
        log.error('Update profile error:', error);
        return createErrorResponse(error);
    }
}
