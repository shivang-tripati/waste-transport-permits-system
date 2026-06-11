import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response';
import {log} from '@/lib/logger';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    log.info('[AUTH_DEBUG] Validate endpoint hit');
    log.info(`[AUTH_DEBUG] Authorization header present: ${request.headers.get('authorization') ? 'YES' : 'NO'}`);
    log.info(`[AUTH_DEBUG] Cookie accessToken present: ${request.cookies.get('accessToken') ? 'YES' : 'NO'}`);

    const authResult = await authenticate(request);

    log.info(`[AUTH_DEBUG] authenticate() success: ${authResult.success ? 'YES' : 'NO'}`);
    if (!authResult.success) {
        log.info('[AUTH_DEBUG] Authentication failure reason');
        return authResult.response;
    }

    log.info(`[AUTH_DEBUG] Authenticated user: {id:${authResult.user.userId},role:${authResult.user.role},companyId:${authResult.user.companyId ?? 'null'}}`);

    return createSuccessResponse({
        user: authResult.user,
    });
}
