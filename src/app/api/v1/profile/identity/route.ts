
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { createIdentityDocumentSchema } from '@/schemas';

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

        const { type, documentNumber } = validation.data;

        const document = await prisma.identityDocument.upsert({
            where: {
                userId_type: {
                    userId: authUser.userId,
                    type: type as any,
                },
            } as any,
            update: {
                documentNumber,
                isVerified: false, // Reset verification on change
            },
            create: {
                userId: authUser.userId,
                type: type as any,
                documentNumber,
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
        console.error('Update identity info error:', error);
        return createErrorResponse(error);
    }
}
