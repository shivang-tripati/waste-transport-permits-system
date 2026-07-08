import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response';
import {log} from '@/lib/logger';
export const runtime = 'nodejs';

/**
 * @swagger
 * /api/v1/auth/validate:
 *   get:
 *     summary: Validate current session
 *     description: >
 *       Validates the current access token (from cookie or Authorization header)
 *       and returns the authenticated user's context.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                           format: email
 *                         role:
 *                           type: string
 *                           enum: [ADMIN, COMPANY_USER, INDIVIDUAL, GUEST]
 *                         companyId:
 *                           type: string
 *                           format: uuid
 *                           nullable: true
 *       401:
 *         description: Invalid or missing token
 */
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
