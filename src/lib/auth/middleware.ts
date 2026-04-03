import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken, extractBearerToken, AccessTokenPayload } from './jwt';
import { hasPermission, Permission, UserContext } from './rbac';
import { ApiError, createErrorResponse } from '@/lib/api/response';
import { cookies } from 'next/headers';

/**
 * Extended request with auth context
 */
export interface AuthenticatedRequest extends NextRequest {
    user?: UserContext;
}

/**
 * Middleware result
 */
export type MiddlewareResult =
    | { success: true; user: UserContext }
    | { success: false; response: NextResponse };

/**
 * Authenticate request and extract user context
 */
export async function authenticate(request: NextRequest): Promise<MiddlewareResult> {

    // 1. try authorization header (react native)
    const authHeader = request.headers.get('Authorization');
    let token = extractBearerToken(authHeader);

    if (!token) {
        // 2. try cookies (nextjs)
        token = request.cookies.get('accessToken')?.value ?? null;
    }

    if (!token) {
        return {
            success: false,
            response: createErrorResponse(
                new ApiError('UNAUTHORIZED', 'Missing or invalid authorization header', 401)
            ),
        };
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
        return {
            success: false,
            response: createErrorResponse(
                new ApiError('UNAUTHORIZED', 'Invalid or expired access token', 401)
            ),
        };
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
        where: { id: decoded.data.userId },
        select: { id: true, role: true, companyId: true, isActive: true },
    });

    if (!user || !user.isActive) {
        return {
            success: false,
            response: createErrorResponse(
                new ApiError('UNAUTHORIZED', 'User account not found or inactive', 401)
            ),
        };
    }

    return {
        success: true,
        user: {
            userId: user.id,
            role: user.role,
            companyId: user.companyId,
        },
    };
}

/**
 * Require specific permission(s)
 */
export function requirePermission(
    user: UserContext,
    permission: Permission | Permission[]
): NextResponse | null {
    const permissions = Array.isArray(permission) ? permission : [permission];

    const hasAllRequired = permissions.every((p) => hasPermission(user.role, p));

    if (!hasAllRequired) {
        return createErrorResponse(
            new ApiError('FORBIDDEN', 'You do not have permission to perform this action', 403)
        );
    }

    return null;
}

/**
 * Helper to create authenticated API handler
 */
export function withAuth<T>(
    handler: (request: NextRequest, user: UserContext) => Promise<NextResponse<T>>
) {
    return async (request: NextRequest): Promise<NextResponse<T | { success: false; error: { code: string; message: string } }>> => {
        const authResult = await authenticate(request);

        if (!authResult.success) {
            return authResult.response as NextResponse<{ success: false; error: { code: string; message: string } }>;
        }

        return handler(request, authResult.user);
    };
}

/**
 * Helper to create handler requiring specific permission
 */
export function withPermission<T>(
    permission: Permission | Permission[],
    handler: (request: NextRequest, user: UserContext) => Promise<NextResponse<T>>
) {
    return withAuth(async (request, user) => {
        const permissionError = requirePermission(user, permission);
        if (permissionError) {
            return permissionError as NextResponse<T>;
        }

        return handler(request, user);
    });
}

/**
 * Get user context from request (for optional auth routes)
 */
export async function getOptionalAuth(request: NextRequest): Promise<UserContext | null> {
    const authHeader = request.headers.get('Authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
        return null;
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: decoded.data.userId },
        select: { id: true, role: true, companyId: true, isActive: true },
    });

    if (!user || !user.isActive) {
        return null;
    }

    return {
        userId: user.id,
        role: user.role,
        companyId: user.companyId,
    };
}
