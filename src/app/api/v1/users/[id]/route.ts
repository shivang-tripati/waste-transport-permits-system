import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, isAdmin } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user: authUser } = authResult;

        // Only admins can view any user details
        if (!isAdmin(authUser.role)) {
            return createErrorResponse(
                CommonErrors.forbidden('Only administrators can view full user details')
            );
        }

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                company: {
                    include: {
                        projects: true
                    }
                },
                identityDocuments: true,
                _count: {
                    select: {
                        permits: true,
                        auditLogs: true
                    }
                }
            }
        });

        if (!user) {
            return createErrorResponse(CommonErrors.notFound('User not found'));
        }

        // Fetch recent permits separately to keep the include clean
        const recentPermits = await prisma.permit.findMany({
            where: { userId: id },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                project: { select: { name: true } },
                plant: { select: { name: true } }
            }
        });

        return createSuccessResponse({
            ...user,
            recentPermits
        });
    } catch (error) {
        console.error('Fetch user detail error:', error);
        return createErrorResponse(error);
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user: authUser } = authResult;

        // Only admins can update user status
        if (!isAdmin(authUser.role)) {
            return createErrorResponse(
                CommonErrors.forbidden('Only administrators can update users')
            );
        }

        const body = await request.json();
        const { isActive } = body;

        if (typeof isActive !== 'boolean') {
            return createErrorResponse(CommonErrors.validationError({ isActive: ['Must be a boolean'] }));
        }

        const oldUser = await prisma.user.findUnique({ where: { id } });
        if (!oldUser) {
            return createErrorResponse(CommonErrors.notFound('User not found'));
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                role: true
            }
        });

        // Create audit log
        await createAuditLog({
            entityType: 'USER',
            entityId: id,
            action: 'UPDATED',
            performedByUserId: authUser.userId,
            previousState: { isActive: oldUser.isActive },
            newState: { isActive: updatedUser.isActive },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(updatedUser);
    } catch (error) {
        console.error('Update user status error:', error);
        return createErrorResponse(error);
    }
}
