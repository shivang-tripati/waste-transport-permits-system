// app/api/notifications/trigger/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import {log} from '@/lib/logger';
import { createSuccessResponse, createErrorResponse, CommonErrors } from '@/lib/api';
import {
    sendTemplateNotification,
    type EventType,        // ← BusinessEvent alias, exported from the orchestrator
} from '@/lib/services/notificationOrchestrator';

/**
 * POST /api/notifications/trigger
 * Internal entry point for triggering notifications programmatically.
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
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const body = await request.json();
        const { eventType, userId, permitId, data } = body;

        if (!eventType || !userId) {
            return createErrorResponse(
                CommonErrors.badRequest('eventType and userId are required')
            );
        }

        // Fetch user phone (and email for fallback)
        const user = await prisma.user.findUnique({
            where:  { id: userId },
            select: { phone: true, email: true },
        });

        if (!user?.phone) {
            return createErrorResponse(
                CommonErrors.notFound('User or user phone number not found')
            );
        }

        // Fetch driver phone if a permitId was provided
        let driverPhone: string | null = null;
        if (permitId) {
            const permit = await prisma.permit.findUnique({
                where:  { id: permitId },
                select: { driverPhone: true },
            });
            driverPhone = permit?.driverPhone ?? null;
        }

        // Fire-and-forget — do NOT await
        sendTemplateNotification({
            eventType:   eventType as EventType,
            userId,
            phone:       user.phone,
            permitId,
            data,
            driverPhone,
            userEmail:   user.email ?? null,
        });

        return createSuccessResponse({ message: 'Notification triggered' });

    } catch (error) {
        log.error('[POST /api/notifications/trigger]', error);
        return createErrorResponse(error);
    }
}