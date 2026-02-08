import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, withPermission } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
    parsePagination,
    parseSort,
    createPaginationMeta,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { createPermitSchema } from '@/schemas';
import { generatePermitNumber } from '@/lib/utils';
import { Prisma } from '@prisma/client';

// Fields allowed for sorting
const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'status', 'permitNumber'];
// Fields allowed for filtering
const FILTERABLE_FIELDS = ['status', 'wasteType', 'projectId', 'plantId'];

export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;
        const { searchParams } = new URL(request.url);

        // Parse pagination and sorting
        const { page, limit, skip } = parsePagination(searchParams);
        const { field: sortField, order: sortOrder } = parseSort(searchParams, SORTABLE_FIELDS);

        // Build where clause based on role
        const where: Prisma.PermitWhereInput = {};

        // Non-admins can only see their own permits (or company permits)
        if (user.role !== 'ADMIN') {
            if (user.companyId) {
                // Company users can see all permits for their company's projects
                where.project = { companyId: user.companyId };
            } else {
                // Individual users can only see their own permits
                where.userId = user.userId;
            }
        }

        // Apply filters
        const status = searchParams.get('status');
        if (status) {
            where.status = status as Prisma.EnumPermitStatusFilter['equals'];
        }

        const wasteType = searchParams.get('wasteType');
        if (wasteType) {
            where.wasteType = wasteType as Prisma.EnumWasteTypeFilter['equals'];
        }

        const projectId = searchParams.get('projectId');
        if (projectId) {
            where.projectId = projectId;
        }

        const plantId = searchParams.get('plantId');
        if (plantId) {
            where.plantId = plantId;
        }

        // Search by permit number
        const search = searchParams.get('search');
        if (search) {
            where.OR = [
                { permitNumber: { contains: search, mode: 'insensitive' } },
                { driverName: { contains: search, mode: 'insensitive' } },
                { vehicleNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Query
        const [permits, total] = await Promise.all([
            prisma.permit.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder },
                include: {
                    project: {
                        select: { id: true, name: true, address: true, city: true },
                    },
                    plant: {
                        select: { id: true, name: true, code: true, city: true },
                    },
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
            prisma.permit.count({ where }),
        ]);

        return createSuccessResponse(permits, createPaginationMeta(page, limit, total));
    } catch (error) {
        console.error('List permits error:', error);
        return createErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;
        const body = await request.json();

        // Validate input
        const validation = createPermitSchema.safeParse(body);
        if (!validation.success) {
            console.error("ZOD ERROR:", validation.error.format());
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const data = validation.data;
        let project = null

        // Verify project if provided
        if (data.projectId) {
            project = await prisma.project.findUnique({
                where: { id: data.projectId },
                include: { company: true },
            });

            if (!project) {
                return createErrorResponse(CommonErrors.notFound('Project'));
            }

            // Non-admins must have access to the project (be part of the company)
            if (user.role !== 'ADMIN' && user.companyId !== project.companyId) {
                return createErrorResponse(
                    CommonErrors.forbidden('You do not have access to this project')
                );
            }
        }

        // Verify plant exists
        const plant = await prisma.plant.findUnique({
            where: { id: data.plantId },
        });

        if (!plant) {
            return createErrorResponse(CommonErrors.notFound('Plant'));
        }

        // Create permit
        const permit = await prisma.permit.create({
            data: {
                permitNumber: generatePermitNumber(),

                wasteType: data.wasteType,
                estimatedWeight: data.estimatedWeight ?? null,
                estimatedVolume: data.estimatedVolume ?? null,
                wasteDescription: data.wasteDescription ?? null,
                projectId: data.projectId ?? null,
                companyId:
                    user.role === 'COMPANY_USER'
                        ? user.companyId
                        : data.projectId
                            ? project?.companyId ?? null
                            : null,

                plantId: data.plantId,

                pickupAddress: data.pickupAddress,
                pickupCity: data.pickupCity,
                pickupState: data.pickupState,
                pickupPincode: data.pickupPincode,

                driverName: data.driverName ?? null,
                driverPhone: data.driverPhone ?? null,
                licenseNumber: data.licenseNumber ?? null,
                vehicleNumber: data.vehicleNumber ?? null,
                vehicleType: data.vehicleType ?? null,

                validFrom: data.validFrom,
                validUntil: data.validUntil,

                userId: user.userId,
                status: 'DRAFT',
            },
            include: {
                project: { select: { id: true, name: true } },
                plant: { select: { id: true, name: true, code: true } },
            },
        });


        // Create audit log
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: permit.id,
            action: 'CREATED',
            performedByUserId: user.userId,
            newState: { permitNumber: permit.permitNumber, status: permit.status },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(permit, undefined, 201);
    } catch (error) {
        console.error('Create permit error:', error);
        return createErrorResponse(error);
    }
}
