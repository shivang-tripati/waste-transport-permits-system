import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRefreshToken } from '@/lib/auth';
import { createSuccessResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        const refreshToken = request.cookies.get("refreshToken")?.value;

        if (refreshToken) {
            const decoded = verifyRefreshToken(refreshToken);

            if (decoded) {
                await prisma.refreshToken.updateMany({
                    where: {
                        id: decoded.data.tokenId,
                        revokedAt: null,
                    },
                    data: {
                        revokedAt: new Date(),
                    },
                });
            }
        }

        const response = createSuccessResponse({
            message: "Logged out successfully",
        });

        response.cookies.set("accessToken", "", { maxAge: 0, path: "/" });
        response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });

        return response;

    } catch (error) {
        console.error("Logout error:", error);

        const response = createSuccessResponse({
            message: "Logged out",
        });

        response.cookies.set("accessToken", "", { maxAge: 0, path: "/" });
        response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });

        return response;
    }
}