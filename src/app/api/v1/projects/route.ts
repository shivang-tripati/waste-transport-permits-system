import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission, isAdmin } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
    parsePagination,
    parseSort,
    createPaginationMeta,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { createProjectSchema } from '@/schemas';
import { Prisma } from '@prisma/client';

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'name', 'city'];

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: List projects
 *     description: >
 *       Returns paginated projects. Admins see all projects;
 *       company users see only their company's projects;
 *       individual users receive an empty list.
 *     tags:
 *       - Projects
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
 *           enum: [createdAt, updatedAt, name, city]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company (admin only)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, city, or address
 *     responses:
 *       200:
 *         description: Paginated list of projects
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
        const { searchParams } = new URL(request.url);
        const { page, limit, skip } = parsePagination(searchParams);
        const { field: sortField, order: sortOrder } = parseSort(searchParams, SORTABLE_FIELDS);

        const where: Prisma.ProjectWhereInput = {};

        // Non-admins can only see their company's projects
        if (!isAdmin(user.role)) {
            if (user.companyId) {
                where.companyId = user.companyId;
            } else {
                // Individual users - no projects to show
                return createSuccessResponse([], createPaginationMeta(page, limit, 0));
            }
        }

        // Filter by company
        const companyId = searchParams.get('companyId');
        if (companyId && isAdmin(user.role)) {
            where.companyId = companyId;
        }

        // Filter by active status
        const isActive = searchParams.get('isActive');
        if (isActive !== null) {
            where.isActive = isActive === 'true';
        }

        // Search
        const search = searchParams.get('search');
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder },
                include: {
                    company: { select: { id: true, name: true } },
                    _count: { select: { permits: true } },
                },
            }),
            prisma.project.count({ where }),
        ]);

        console.log("projects", projects);

        return createSuccessResponse(projects, createPaginationMeta(page, limit, total));
    } catch (error) {
        console.error('List projects error:', error);
        return createErrorResponse(error);
    }
}

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a project
 *     description: Creates a new project for a company. Requires `project:create` permission.
 *     tags:
 *       - Projects
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - city
 *               - state
 *               - pincode
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
 *               companyId:
 *                 type: string
 *                 format: uuid
 *                 description: Defaults to the authenticated user's company
 *     responses:
 *       201:
 *         description: Project created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Company not found
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Check permissions
        if (!hasPermission(user.role, 'project:create')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to create projects')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = createProjectSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const data = validation.data;

        const companyId = data.companyId ?? user.companyId;

        if (!companyId) {
            return createErrorResponse(
                CommonErrors.validationError({
                    companyId: ['Company is required'],
                })
            );
        }

        // Verify company exists
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            return createErrorResponse(CommonErrors.notFound('Company'));
        }

        if (!isAdmin(user.role)) {
            if (user.companyId !== companyId) {
                return createErrorResponse(
                    CommonErrors.forbidden('You can only create projects for your own company')
                );
            }
        }

        const { companyId: _, ...projectData } = data;

        // Create project
        const project = await prisma.project.create({
            data: {
                ...projectData,
                companyId
            },
            include: {
                company: { select: { id: true, name: true } },
            },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'PROJECT',
            entityId: project.id,
            action: 'CREATED',
            performedByUserId: user.userId,
            newState: { name: project.name, companyId: project.companyId },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(project, undefined, 201);
    } catch (error) {
        console.error('Create project error:', error);
        return createErrorResponse(error);
    }
}
