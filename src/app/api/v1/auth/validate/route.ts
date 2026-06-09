import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    console.log('[AUTH_DEBUG] Validate endpoint hit');
    console.log(`[AUTH_DEBUG] Authorization header present: ${request.headers.get('authorization') ? 'YES' : 'NO'}`);
    console.log(`[AUTH_DEBUG] Cookie accessToken present: ${request.cookies.get('accessToken') ? 'YES' : 'NO'}`);

    const authResult = await authenticate(request);

    console.log(`[AUTH_DEBUG] authenticate() success: ${authResult.success ? 'YES' : 'NO'}`);
    if (!authResult.success) {
        console.log('[AUTH_DEBUG] Authentication failure reason');
        return authResult.response;
    }

    console.log(`[AUTH_DEBUG] Authenticated user: {id:${authResult.user.userId},role:${authResult.user.role},companyId:${authResult.user.companyId ?? 'null'}}`);

    return createSuccessResponse({
        user: authResult.user,
    });
}
