import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const authResult = await authenticate(request);

        if (!authResult.success) {
            return authResult.response;
        }

        // Revoke all refresh tokens for this user
        await prisma.refreshToken.updateMany({
            where: {
                userId: authResult.user.userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });

        return createSuccessResponse({
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        return createErrorResponse(error);
    }
}
