
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {log} from '@/lib/logger';
import { authenticate } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { createIdentityDocumentSchema } from '@/schemas';

/**
 * @swagger
 * /api/v1/profile/identity:
 *   post:
 *     summary: Submit identity document
 *     description: Upserts an identity document (Aadhaar or PAN) for the authenticated user.
 *     tags:
 *       - Profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - documentNumber
 *               - filePath
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [AADHAAR, PAN]
 *               documentNumber:
 *                 type: string
 *               filePath:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { user: authUser } = authResult;
        const body = await request.json();

        const validation = createIdentityDocumentSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const { type, documentNumber, filePath } = validation.data;

        const document = await prisma.identityDocument.upsert({
            where: {
                userId_type: {
                    userId: authUser.userId,
                    type: type as any,
                },
            } as any,
            update: {
                documentNumber,
                filePath,
                isVerified: false, // Reset verification on change
            },
            create: {
                userId: authUser.userId,
                type: type as any,
                documentNumber,
                filePath,
            },
        });

        // Audit log
        await createAuditLog({
            entityType: 'USER',
            entityId: authUser.userId,
            action: 'UPDATED',
            performedByUserId: authUser.userId,
            newState: { documentType: type, action: 'IDENTITY_DOCUMENT_UPSERT' },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        return createSuccessResponse(document);
    } catch (error) {
        log.error('Update identity info error:', error);
        return createErrorResponse(error);
    }
}
