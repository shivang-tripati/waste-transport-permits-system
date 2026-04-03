import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
    verifyPassword,
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpiry,
} from '@/lib/auth';
import { createErrorResponse, CommonErrors } from '@/lib/api';
import { getClientIP, getUserAgent } from '@/lib/api/audit';
import { loginSchema } from '@/schemas';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const { email, password } = validation.data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                companyId: true,
                passwordHash: true,
                isActive: true,
            },
        });

        if (!user) {
            return createErrorResponse(
                CommonErrors.unauthorized('Invalid email or password')
            );
        }

        if (!user.isActive) {
            return createErrorResponse(
                CommonErrors.forbidden('Your account has been deactivated')
            );
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
            return createErrorResponse(
                CommonErrors.unauthorized('Invalid email or password')
            );
        }

        // Generate tokens
        const tokenId = uuidv4();
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        });

        const refreshToken = generateRefreshToken({
            userId: user.id,
            tokenId,
        });

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                id: tokenId,
                token: refreshToken,
                userId: user.id,
                expiresAt: getRefreshTokenExpiry(),
                userAgent: getUserAgent(request.headers),
                ipAddress: getClientIP(request.headers),
            },
        });

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Remove password hash
        const { passwordHash: _, ...userWithoutPassword } = user;


        const clientType = request.headers.get('X-Client-Type');
        const isMobile = clientType === 'mobile';


        if (isMobile) {
            // return mobile response
            return NextResponse.json({
                success: true,
                data: {
                    user: userWithoutPassword,
                    accessToken,
                    refreshToken,
                },
            });
        }

        //  web flow set cookies
        const response = NextResponse.json({
            success: true,
            data: {
                user: userWithoutPassword,
            },
        });

        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 30,
        });

        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 1, // 10 days
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return createErrorResponse(error);
    }
}
