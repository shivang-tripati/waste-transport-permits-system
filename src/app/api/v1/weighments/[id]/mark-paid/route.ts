import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { markWeighmentPaidSchema } from '@/schemas';
import  {log} from '@/lib/logger';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/v1/weighments/{id}/mark-paid:
 *   post:
 *     summary: Mark weighment as paid
 *     description: Records payment details for a PENDING weighment. Admin/Plant Operator only.
 *     tags:
 *       - Weighments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentAmount
 *             properties:
 *               paymentAmount:
 *                 type: number
 *                 minimum: 0
 *               paymentReference:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD, UPI, BANK_TRANSFER]
 *     responses:
 *       200:
 *         description: Payment recorded
 *       400:
 *         description: Validation error, not PENDING, or already PAID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Weighment not found
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user } = authResult;

        // Check permission - only admins can mark payments
        if (!hasPermission(user.role, 'weighment:update')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to update payment status')
            );
        }

        const body = await request.json();

        // Validate input
        const validation = markWeighmentPaidSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        // Get existing weighment
        const existing = await prisma.weighment.findUnique({
            where: { id },
        });

        if (!existing) {
            return createErrorResponse(CommonErrors.notFound('Weighment'));
        }

        // Can only mark payment for PENDING weighments
        if (existing.status !== 'PENDING') {
            return createErrorResponse(
                CommonErrors.badRequest('Can only mark payment for weighments in PENDING status')
            );
        }

        // Check payment is not already marked as PAID
        if (existing.paymentStatus === 'PAID') {
            return createErrorResponse(
                CommonErrors.badRequest('Payment has already been marked as PAID')
            );
        }

        const { paymentAmount, paymentReference, paymentMethod } = validation.data;

        // Update weighment payment status
        const weighment = await prisma.weighment.update({
            where: { id },
            data: {
                paymentStatus: 'PAID',
                paymentAmount,
                paymentReference,
                paymentMethod: paymentMethod || null,
                paidByUserId: user.userId,
                paidAt: new Date(),
                updatedByUserId: user.userId,
            },
            include: {
                permit: { select: { id: true, permitNumber: true } },
                plant: { select: { id: true, name: true, code: true } },
                paidBy: { select: { id: true, name: true } },
            },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'WEIGHMENT',
            entityId: weighment.id,
            action: 'PAID',
            performedByUserId: user.userId,
            previousState: { paymentStatus: existing.paymentStatus },
            newState: {
                paymentStatus: weighment.paymentStatus,
                paymentAmount,
                paymentReference,
                paymentMethod
            },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(weighment);
    } catch (error) {
        log.error('Mark weighment paid error:', error);
        return createErrorResponse(error);
    }
}
