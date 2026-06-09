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
        console.log('[AUTH_DEBUG] Login request received');
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
            console.log('[AUTH_DEBUG] Login failed: user not found');
            return createErrorResponse(
                CommonErrors.unauthorized('Invalid email or password')
            );
        }

        console.log(`[AUTH_DEBUG] User found: {id:${user.id},email:${user.email},role:${user.role}}`);

        if (!user.isActive) {
            return createErrorResponse(
                CommonErrors.forbidden('Your account has been deactivated')
            );
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
            console.log('[AUTH_DEBUG] Login failed: password verification failed');
            return createErrorResponse(
                CommonErrors.unauthorized('Invalid email or password')
            );
        }
        console.log('[AUTH_DEBUG] Password verified');

        // Generate tokens
        const tokenId = uuidv4();
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        });
        console.log('[AUTH_DEBUG] Access token generated');

        const refreshToken = generateRefreshToken({
            userId: user.id,
            tokenId,
        });
        console.log('[AUTH_DEBUG] Refresh token generated');

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

        const secure = process.env.NODE_ENV === 'production';
        const sameSite = 'lax' as const;
        const path = '/';
        const maxAge = 60 * 30;
        console.log(`[AUTH_DEBUG] Setting accessToken cookie: secure=${secure}, sameSite=${sameSite}, path=${path}, maxAge=${maxAge}`);
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure,
            sameSite,
            path,
            maxAge,
        });

        const refreshMaxAge = 60 * 60 * 24 * 1;
        console.log(`[AUTH_DEBUG] Setting refreshToken cookie: secure=${secure}, sameSite=${sameSite}, path=${path}, maxAge=${refreshMaxAge}`);
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure,
            sameSite,
            path,
            maxAge: refreshMaxAge,
        });

        console.log('[AUTH_DEBUG] Login response returned');
        return response;
    } catch (error) {
        console.error('Login error:', error);
        return createErrorResponse(error);
    }
}
