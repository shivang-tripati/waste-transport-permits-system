import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const authResult = await authenticate(request);

    if (!authResult.success) {
        return authResult.response;
    }

    return createSuccessResponse({
        user: authResult.user,
    });
}
