
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse, CommonErrors } from '@/lib/api';
import { createWasteEvidenceSchema } from '@/schemas';

/**
 * @swagger
 * /api/v1/permits/{id}/evidence:
 *   post:
 *     summary: Add waste evidence to a permit
 *     description: Uploads waste evidence metadata for a permit. Only the permit creator or admin can add evidence.
 *     tags:
 *       - Permits
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
 *               - fileName
 *               - filePath
 *               - fileSize
 *               - mimeType
 *             properties:
 *               fileName:
 *                 type: string
 *                 minLength: 1
 *               filePath:
 *                 type: string
 *                 minLength: 1
 *               fileSize:
 *                 type: number
 *                 minimum: 0
 *                 exclusiveMinimum: true
 *               mimeType:
 *                 type: string
 *               description:
 *                 type: string
 *               capturedAt:
 *                 type: string
 *                 format: date-time
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *     responses:
 *       200:
 *         description: Evidence created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Permit not found
 */
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
