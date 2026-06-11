import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, isAdmin } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import {log} from '@/lib/logger';

export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user: authUser } = authResult;

        // Only admins can see overall stats
        if (!isAdmin(authUser.role)) {
            return createErrorResponse(
                CommonErrors.forbidden('Only administrators can access dashboard statistics')
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalPermits,
            pendingApproval,
            inTransit,
            completedToday,
            recentActivity
        ] = await Promise.all([
            prisma.permit.count(),
            prisma.permit.count({ where: { status: 'SUBMITTED' } }),
            prisma.permit.count({ where: { status: 'IN_TRANSIT' } }),
            prisma.permit.count({
                where: {
                    status: 'COMPLETED',
                    completedAt: { gte: today }
                }
            }),
            prisma.permit.findMany({
                take: 5,
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: { select: { name: true } },
                    project: { select: { name: true } }
                }
            })
        ]);

        return createSuccessResponse({
            stats: {
                totalPermits,
                pendingApproval,
                inTransit,
                completedToday,
            },
            recentActivity: recentActivity.map(p => ({
                id: p.id,
                permitNumber: p.permitNumber,
                status: p.status,
                userName: p.user.name,
                projectName: p.project?.name || 'Individual',
                updatedAt: p.updatedAt
            }))
        });
    } catch (error) {
        log.error('Dashboard stats error:', error);
        return createErrorResponse(error);
    }
}
