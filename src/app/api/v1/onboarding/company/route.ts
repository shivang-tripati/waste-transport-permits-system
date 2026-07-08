
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import {log} from '@/lib/logger';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { createCompanySchema } from '@/schemas';

/**
 * @swagger
 * /api/v1/onboarding/company:
 *   post:
 *     summary: Onboard a company
 *     description: >
 *       Creates a new company and associates the authenticated COMPANY_USER with it.
 *       Fails if the user already belongs to a company.
 *     tags:
 *       - Onboarding
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
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
 *       201:
 *         description: Company created and user linked
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — not a company user
 *       409:
 *         description: User already has a company, or duplicate registration/GST number
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Ensure user is COMPANY_USER
        if (user.role !== 'COMPANY_USER') {
            return createErrorResponse(
                CommonErrors.forbidden('Only company users can perform this action')
            );
        }

        // Check if user already has a company
        if (user.companyId) {
            return createErrorResponse(
                CommonErrors.conflict('User is already associated with a company')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = createCompanySchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const data = validation.data;

        // Check for unique registration number
        if (data.registrationNumber) {
            const existing = await prisma.company.findUnique({
                where: { registrationNumber: data.registrationNumber },
            });
            if (existing) {
                return createErrorResponse(
                    CommonErrors.conflict('A company with this registration number already exists')
                );
            }
        }

        // Check for unique GST number
        if (data.gstNumber) {
            const existing = await prisma.company.findUnique({
                where: { gstNumber: data.gstNumber },
            });
            if (existing) {
                return createErrorResponse(
                    CommonErrors.conflict('A company with this GST number already exists')
                );
            }
        }

        // Transaction: Create company AND link user
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Company
            const company = await tx.company.create({
                data,
            });

            // 2. Link User
            await tx.user.update({
                where: { id: user.userId },
                data: { companyId: company.id },
            });

            return company;
        });

        // Create audit log
        await createAuditLog({
            entityType: 'COMPANY',
            entityId: result.id,
            action: 'CREATED',
            performedByUserId: user.userId,
            newState: { name: result.name },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(result, undefined, 201);
    } catch (error) {
        log.error('Onboarding company error:', error);
        return createErrorResponse(error);
    }
}
