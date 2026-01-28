import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
    hashPassword,
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpiry,
} from '@/lib/auth';
import { createSuccessResponse, createErrorResponse, CommonErrors } from '@/lib/api';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/api/audit';
import { registerSchema } from '@/schemas';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = registerSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse(
                CommonErrors.validationError(validation.error.flatten().fieldErrors)
            );
        }

        const { email, password, name, phone, role, companyId } = validation.data;

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return createErrorResponse(
                CommonErrors.conflict('An account with this email already exists')
            );
        }

        // Check if phone already exists (if provided)
        if (phone) {
            const existingPhone = await prisma.user.findUnique({
                where: { phone },
            });

            if (existingPhone) {
                return createErrorResponse(
                    CommonErrors.conflict('An account with this phone number already exists')
                );
            }
        }

        // If company user, verify company exists
        if (companyId) {
            const company = await prisma.company.findUnique({
                where: { id: companyId },
            });

            if (!company) {
                return createErrorResponse(CommonErrors.notFound('Company'));
            }
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                phone,
                role: role || 'INDIVIDUAL',
                companyId: companyId || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                companyId: true,
                createdAt: true,
            },
        });

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

        // Create audit log
        await createAuditLog({
            entityType: 'USER',
            entityId: user.id,
            action: 'CREATED',
            performedByUserId: user.id,
            newState: { email: user.email, name: user.name, role: user.role },
            ipAddress: getClientIP(request.headers),
            userAgent: getUserAgent(request.headers),
        });

        const clientType = request.headers.get('X-Client-Type');
        const isMobile = clientType === 'mobile';

        if (isMobile) {
            return NextResponse.json({
                success: true,
                data: {
                    user,
                    accessToken,
                    refreshToken,
                },
            });
        }

        const response = NextResponse.json({
            success: true,
            data: {
                user,
            },
        });

        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 15, // 15 minutes
        });

        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 10, // 10 days
        });

        return response;
    } catch (error) {
        console.error('Registration error:', error);
        return createErrorResponse(error);
    }
}
