import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse, CommonErrors } from '@/lib/api';
import { sendTemplateNotification } from '@/lib/services/notificationOrchestrator';
import { BusinessEvent } from '@/lib/notifications/templateRegistry';

/**
 * POST /api/notifications/trigger
 * External entry point for triggering WhatsApp notifications
 */
/**
 * @swagger
 * /api/v1/notifications/trigger:
 *   post:
 *     summary: Trigger a notification
 *     description: >
 *       External entry point for triggering WhatsApp notifications.
 *       Admin or trusted app only.
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *               - userId
 *             properties:
 *               eventType:
 *                 type: string
 *               userId:
 *                 type: string
 *                 format: uuid
 *               permitId:
 *                 type: string
 *                 format: uuid
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification triggered successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User phone number not found
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate (System Admin or trusted app)
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const body = await request.json();
        const { eventType, userId, permitId, data } = body;

        // 2. Validate input
        if (!eventType || !userId) {
            return createErrorResponse(CommonErrors.badRequest('eventType and userId are required'));
        }

        // 3. Fetch user phone number
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { phone: true }
        });

        if (!user || !user.phone) {
            return createErrorResponse(CommonErrors.notFound('User phone number not found'));
        }

        // 4. Trigger notification (Async/Fire-and-forget)
        sendTemplateNotification({
            eventType: eventType as BusinessEvent,
            userId,
            phone: user.phone,
            permitId,
            data
        });

        return createSuccessResponse({ message: 'Notification triggered successfully' });
    } catch (error) {
        console.error('Trigger notification error:', error);
        return createErrorResponse(error);
    }
}
