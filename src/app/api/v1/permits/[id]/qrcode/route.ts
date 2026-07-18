import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import {
    createSuccessResponse,
    createErrorResponse,
    CommonErrors,
} from '@/lib/api';
import * as QRCode from 'qrcode';
import { log } from '@/lib/logger';

interface RouteParams {
    params: Promise<{ id: string }>;
}

const QR_PRIMARY_COLOR = '#762D58';
const QR_BACKGROUND_COLOR = '#FFFFFF';

/**
 * @swagger
 * /api/v1/permits/{id}/qrcode:
 *   get:
 *     summary: Generate QR code for permit verification
 *     description: Returns a branded QR-code data URL and verification URL.
 *     tags:
 *       - Permits
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Permit not found
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        const authResult = await authenticate(request);

        if (!authResult.success) {
            return authResult.response;
        }

        const permit = await prisma.permit.findUnique({
            where: { id },
            select: {
                id: true,
                token: true,
                permitNumber: true,
                status: true,
                userId: true,
                project: {
                    select: {
                        companyId: true,
                    },
                },
            },
        });

        if (!permit) {
            return createErrorResponse(
                CommonErrors.notFound('Permit')
            );
        }

        const { user } = authResult;

        const hasAccess =
            user.role === 'ADMIN' ||
            permit.userId === user.userId ||
            Boolean(
                user.companyId &&
                user.companyId === permit.project?.companyId
            );

        if (!hasAccess) {
            return createErrorResponse(
                CommonErrors.forbidden(
                    'You do not have access to this permit'
                )
            );
        }

        const appUrl =
            process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
            'http://localhost:3000';

        const verificationUrl = new URL(
            '/compliance/verify',
            appUrl
        );

        verificationUrl.searchParams.set('token', permit.token);

        /*
         * High error correction improves scanning reliability,
         * especially when the QR is printed, resized, or displayed
         * on a low-brightness mobile screen.
         */
        const qrCodeDataUrl = await QRCode.toDataURL(
            verificationUrl.toString(),
            {
                width: 420,
                margin: 3,
                errorCorrectionLevel: 'H',
                color: {
                    dark: '#762D58',
                    light: '#FFFFFF',
                },
            }
        );

        return createSuccessResponse({
            permitId: permit.id,
            permitNumber: permit.permitNumber,
            status: permit.status,
            token: permit.token,
            verificationUrl: verificationUrl.toString(),
            qrCode: qrCodeDataUrl,
            qrCodeStyle: {
                foregroundColor: QR_PRIMARY_COLOR,
                backgroundColor: QR_BACKGROUND_COLOR,
                errorCorrectionLevel: 'H',
                width: 420,
            },
        });
    } catch (error) {

        return createErrorResponse(error);
    }
}