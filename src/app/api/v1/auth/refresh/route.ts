import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
    verifyRefreshToken,
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpiry,
} from '@/lib/auth';
import { createSuccessResponse, createErrorResponse, CommonErrors } from '@/lib/api';
import { getClientIP, getUserAgent } from '@/lib/api/audit';
import { refreshTokenSchema } from '@/schemas';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = refreshTokenSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const { refreshToken: tokenString } = validation.data;

        // Verify the token
        const decoded = verifyRefreshToken(tokenString);

        if (!decoded) {
            return createErrorResponse(
                CommonErrors.unauthorized('Invalid or expired refresh token')
            );
        }

        // Find the refresh token in database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { id: decoded.data.tokenId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        companyId: true,
                        isActive: true,
                    },
                },
            },
        });

        if (!storedToken || storedToken.revokedAt) {
            return createErrorResponse(
                CommonErrors.unauthorized('Refresh token has been revoked')
            );
        }

        if (new Date() > storedToken.expiresAt) {
            return createErrorResponse(
                CommonErrors.unauthorized('Refresh token has expired')
            );
        }

        if (!storedToken.user.isActive) {
            return createErrorResponse(
                CommonErrors.forbidden('Your account has been deactivated')
            );
        }

        // Revoke old refresh token (rotation)
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

        // Generate new tokens
        const newTokenId = uuidv4();
        const accessToken = generateAccessToken({
            userId: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
            companyId: storedToken.user.companyId,
        });
        const refreshToken = generateRefreshToken({
            userId: storedToken.user.id,
            tokenId: newTokenId,
        });

        // Store new refresh token
        await prisma.refreshToken.create({
            data: {
                id: newTokenId,
                token: refreshToken,
                userId: storedToken.user.id,
                expiresAt: getRefreshTokenExpiry(),
                userAgent: getUserAgent(request.headers),
                ipAddress: getClientIP(request.headers),
            },
        });

        return createSuccessResponse({
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        return createErrorResponse(error);
    }
}
