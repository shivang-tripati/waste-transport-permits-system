import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, isAdmin } from '@/lib/auth';
import {log} from '@/lib/logger';
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
        log.error('List users error:', error);
        return createErrorResponse(error);
    }
}
