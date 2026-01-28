
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse, CommonErrors } from '@/lib/api';
import { createWasteEvidenceSchema } from '@/schemas';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: permitId } = await params;

        // 1. Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }
        const user = authResult.user;

        // 2. Validate input and Permission
        // Check if permit exists
        const permit = await prisma.permit.findUnique({
            where: { id: permitId },
            include: {
                user: true,
            },
        });

        if (!permit) {
            return createErrorResponse(CommonErrors.notFound('Permit'));
        }

        // Authorization: User must be creator or Admin
        if (user.role !== 'ADMIN' && permit.userId !== user.userId) {
            return createErrorResponse(CommonErrors.forbidden('You can only add evidence to your own permits'));
        }

        // 3. Process Request
        // We expect the file info to be passed in the body (after storage upload)
        const body = await request.json();

        // Ensure permitId matches URL param
        body.permitId = permitId;

        const validatedData = createWasteEvidenceSchema.safeParse(body);

        if (!validatedData.success) {
            return createErrorResponse(CommonErrors.validationError(validatedData.error));
        }

        const { fileName, filePath, fileSize, mimeType, description, latitude, longitude } = validatedData.data;

        // 4. Create Evidence Record
        const evidence = await prisma.wasteEvidence.create({
            data: {
                permitId,
                fileName,
                filePath,
                fileSize,
                mimeType,
                description,
                capturedAt: new Date(), // Assuming uploaded now = captured now approx
                latitude,
                longitude,
            },
        });

        return createSuccessResponse(evidence);
    } catch (error) {
        return createErrorResponse(error);
    }
}
