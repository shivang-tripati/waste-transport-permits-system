import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { approveWeighmentSchema } from '@/schemas';
import { generateWeighmentSlip } from '@/lib/services/pdf-generator';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/v1/weighments/{id}/approve:
 *   post:
 *     summary: Approve a weighment
 *     description: >
 *       Approves a PENDING, PAID weighment. Completes the associated permit.
 *       Requires `weighment:approve` permission (Admin/Plant Operator).
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentAmount:
 *                 type: number
 *                 minimum: 0
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD, UPI, BANK_TRANSFER]
 *             description: Optional legacy payment capture during approval
 *     responses:
 *       200:
 *         description: Weighment approved and slip generated
 *       400:
 *         description: Not in PENDING status or not PAID
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

        // Check permission
        if (!hasPermission(user.role, 'weighment:approve')) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have permission to approve weighments')
            );
        }

        const body = await request.json();

        // Validate input (now optional - payment may have been captured separately)
        const validation = approveWeighmentSchema.safeParse(body);

        // Get existing weighment
        const existing = await prisma.weighment.findUnique({
            where: { id },
            include: { permit: true },
        });

        if (!existing) {
            return createErrorResponse(CommonErrors.notFound('Weighment'));
        }

        // Can only approve PENDING weighments
        if (existing.status !== 'PENDING') {
            return createErrorResponse(
                CommonErrors.badRequest('Can only approve weighments in PENDING status')
            );
        }

        // Must be PAID before approval
        if (existing.paymentStatus !== 'PAID') {
            return createErrorResponse(
                CommonErrors.badRequest('Weighment must be marked as PAID before approval')
            );
        }

        // Prepare update data
        const updateData: any = {
            status: 'APPROVED',
            approvedByUserId: user.userId,
            approvedAt: new Date(),
            updatedByUserId: user.userId,
        };

        // Add payment info if provided in this request (legacy support)
        if (validation.success) {
            const { paymentAmount, paymentMethod } = validation.data;
            if (paymentAmount !== undefined) {
                updateData.paymentAmount = paymentAmount;
            }
            if (paymentMethod !== undefined) {
                updateData.paymentMethod = paymentMethod;
            }
        }

        // Update weighment to APPROVED and update permit to COMPLETED
        const [weighment] = await prisma.$transaction([
            prisma.weighment.update({
                where: { id },
                data: updateData,
                include: {
                    permit: { select: { id: true, permitNumber: true } },
                    plant: { select: { id: true, name: true, code: true } },
                    approvedBy: { select: { id: true, name: true } },
                },
            }),
            prisma.permit.update({
                where: { id: existing.permitId },
                data: {
                    status: 'COMPLETED',
                    completedByUserId: user.userId,
                    completedAt: new Date(),
                },
            }),
        ]);

        // Generate PDF weighment slip
        let fileUrl: string | null = null;
        try {
            fileUrl = await generateWeighmentSlip(id);

            // Update weighment with file URL
            await prisma.weighment.update({
                where: { id },
                data: { fileUrl },
            });
        } catch (pdfError) {
            console.error('PDF generation error:', pdfError);
            // Continue even if PDF generation fails - it can be generated later
        }

        // Create audit log for weighment
        await createAuditLog({
            entityType: 'WEIGHMENT',
            entityId: weighment.id,
            action: 'APPROVED',
            performedByUserId: user.userId,
            previousState: { status: existing.status },
            newState: {
                status: weighment.status,
                paymentAmount: updateData.paymentAmount,
                fileUrl
            },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        // Create audit log for permit completion
        await createAuditLog({
            entityType: 'PERMIT',
            entityId: existing.permitId,
            action: 'COMPLETED',
            performedByUserId: user.userId,
            previousState: { status: existing.permit.status },
            newState: { status: 'COMPLETED' },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        // Return weighment with updated fileUrl
        return createSuccessResponse({
            ...weighment,
            fileUrl,
        });
    } catch (error) {
        console.error('Approve weighment error:', error);
        return createErrorResponse(error);
    }
}
