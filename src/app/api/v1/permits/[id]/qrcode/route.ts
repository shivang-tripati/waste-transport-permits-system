import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse, CommonErrors } from '@/lib/api';
import * as QRCode from 'qrcode';
import {log} from '@/lib/logger';
interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Authenticate
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        // Get permit
        const permit = await prisma.permit.findUnique({
            where: { id },
            select: {
                id: true,
                token: true,
                permitNumber: true,
                status: true,
                userId: true,
                project: { select: { companyId: true } },
            },
        });

        if (!permit) {
            return createErrorResponse(CommonErrors.notFound('Permit'));
        }

        const { user } = authResult;

        // Check access (owner, company member, or admin)
        const hasAccess =
            user.role === 'ADMIN' ||
            permit.userId === user.userId ||
            (user.companyId && user.companyId === permit?.project?.companyId);

        if (!hasAccess) {
            return createErrorResponse(
                CommonErrors.forbidden('You do not have access to this permit')
            );
        }

        // Generate verification URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verificationUrl = `${appUrl}/compliance/verify?token=${permit.token}`;

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
            errorCorrectionLevel: 'M',
        });

        return createSuccessResponse({
            permitId: permit.id,
            permitNumber: permit.permitNumber,
            token: permit.token,
            verificationUrl,
            qrCode: qrCodeDataUrl,
        });
    } catch (error) {
        log.error('Generate QR code error:', error);
        return createErrorResponse(error);
    }
}
