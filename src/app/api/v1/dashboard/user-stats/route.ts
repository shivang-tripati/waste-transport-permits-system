import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
} from '@/lib/api';
import { Prisma } from '@prisma/client';
import {log} from '@/lib/logger';

/**
 * @swagger
 * /api/v1/dashboard/user-stats:
 *   get:
 *     summary: Get user-specific dashboard statistics
 *     description: Returns dashboard metrics filtered for the authenticated user (or their company).
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: User dashboard statistics
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Build where clause based on role (similar to permits list API)
        const where: Prisma.PermitWhereInput = {};

        if (user.role !== 'ADMIN') {
            if (user.companyId) {
                // Company users see permits for their company
                where.project = { companyId: user.companyId };
            } else {
                // Individual users only see their own permits
                where.userId = user.userId;
            }
        }

        // Calculate first day of current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalPermits,
            activePermits,
            pendingApproval,
            completedThisMonth,
            recentActivity
        ] = await Promise.all([
            prisma.permit.count({ where }),
            prisma.permit.count({
                where: {
                    ...where,
                    status: { in: ['APPROVED', 'IN_TRANSIT'] }
                }
            }),
            prisma.permit.count({
                where: {
                    ...where,
                    status: 'SUBMITTED'
                }
            }),
            prisma.permit.count({
                where: {
                    ...where,
                    status: 'COMPLETED',
                    completedAt: { gte: firstDayOfMonth }
                }
            }),
            prisma.permit.findMany({
                where,
                take: 5,
                orderBy: { updatedAt: 'desc' },
                include: {
                    project: { select: { name: true } },
                    plant: { select: { name: true } }
                }
            })
        ]);

        return createSuccessResponse({
            stats: {
                totalPermits,
                activePermits,
                pendingApproval,
                completedThisMonth,
            },
            recentActivity: recentActivity.map(p => ({
                id: p.id,
                permitNumber: p.permitNumber,
                status: p.status,
                projectName: p.project?.name || 'Individual',
                plantName: p.plant.name,
                updatedAt: p.updatedAt
            }))
        });
    } catch (error) {
        log.error('User dashboard stats error:', error);
        return createErrorResponse(error);
    }
}
