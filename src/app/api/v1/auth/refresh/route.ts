import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
    verifyRefreshToken,
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpiry,
} from "@/lib/auth";
import { createErrorResponse, CommonErrors } from "@/lib/api";
import { getClientIP, getUserAgent } from "@/lib/api/audit";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        let body: any = null;

        try {
            body = await request.json();
        } catch {
            body = null;
        }

        // 2️⃣ Extract refresh token
        let tokenString = body?.refreshToken;

        const cookieStore = await cookies();

        if (!tokenString) {
            tokenString = cookieStore.get("refreshToken")?.value;
        }

        if (!tokenString) {
            return createErrorResponse(
                CommonErrors.unauthorized("Missing refresh token")
            );
        }

        // 3️⃣ Verify token
        const decoded = verifyRefreshToken(tokenString);

        if (!decoded) {
            return createErrorResponse(
                CommonErrors.unauthorized("Invalid or expired refresh token")
            );
        }

        // 4️⃣ Find stored token
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

        if (
            !storedToken ||
            storedToken.revokedAt ||
            new Date() > storedToken.expiresAt ||
            !storedToken.user.isActive
        ) {
            return createErrorResponse(
                CommonErrors.unauthorized("Refresh token invalid")
            );
        }

        // 5️⃣ Rotate tokens
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

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

        // 6️⃣ Detect client type
        const clientType = request.headers.get("X-Client-Type");
        const isMobile = clientType === "mobile";

        // 🔥 MOBILE RESPONSE
        if (isMobile) {
            return NextResponse.json({
                success: true,
                data: { accessToken, refreshToken },
            });
        }

        // 🔥 WEB RESPONSE (cookies)
        const response = NextResponse.json({ success: true });

        response.cookies.set("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        response.cookies.set("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 15,
        });

        return response;
    } catch (error) {
        console.error("Refresh error:", error);
        return createErrorResponse(error);
    }
}
