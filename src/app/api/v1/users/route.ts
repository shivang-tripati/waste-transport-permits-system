import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, isAdmin } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
    parsePagination,
    parseSort,
    createPaginationMeta,
} from '@/lib/api';
import { Prisma, UserRole } from '@prisma/client';

const SORTABLE_FIELDS = ['createdAt', 'name', 'email', 'role'];

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List users
 *     description: Returns a paginated list of users. Admin only.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, email, role]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, COMPANY_USER, INDIVIDUAL, GUEST]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user: authUser } = authResult;

        // Only admins can list all users
        if (!isAdmin(authUser.role)) {
            return createErrorResponse(
                CommonErrors.forbidden('Only administrators can access this resource')
            );
        }

        const { searchParams } = new URL(request.url);
        const { page, limit, skip } = parsePagination(searchParams);
        const { field: sortField, order: sortOrder } = parseSort(searchParams, SORTABLE_FIELDS);

        const where: Prisma.UserWhereInput = {};

        // Filter by role
        const role = searchParams.get('role');
        if (role && Object.values(UserRole).includes(role as UserRole)) {
            where.role = role as UserRole;
        }

        // Search
        const search = searchParams.get('search');
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    companyId: true,
                    company: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            }),
            prisma.user.count({ where }),
        ]);

        return createSuccessResponse(users, createPaginationMeta(page, limit, total));
    } catch (error) {
        console.error('List users error:', error);
        return createErrorResponse(error);
    }
}
