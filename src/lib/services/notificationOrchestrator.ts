/**
 * Notification Orchestrator
 * Centralized logic for triggering notifications across the system
 */

import { prisma } from '@/lib/db';
import { TEMPLATE_REGISTRY, BusinessEvent } from '../notifications/templateRegistry';
import { sendWhatsAppTemplate, buildParameters } from './whatsappService';

export interface NotificationParams {
    eventType: BusinessEvent;
    userId: string;
    phone: string;
    permitId?: string;
    data: any;
}

/**
 * Sends a template notification and logs it to the database.
 * This should be called without 'await' in API routes to avoid blocking.
 */
export async function sendTemplateNotification({
    eventType,
    userId,
    phone,
    permitId,
    data
}: NotificationParams) {
    try {
        // 1. Resolve template configuration
        const config = TEMPLATE_REGISTRY[eventType];
        if (!config) {
            console.error(`[Orchestrator] No template found for event: ${eventType}`);
            return;
        }

        // 2. Build parameters and components
        const params = config.paramBuilder(data);
        const components = buildParameters(params);

        // 3. Create initial notification record in DB
        const notification = await prisma.notification.create({
            data: {
                type: 'WHATSAPP',
                status: 'PENDING',
                recipientPhone: phone,
                userId,
                permitId,
                message: `Template: ${config.templateName} | Params: ${params.join(', ')}`
            }
        });

        console.log(`[Orchestrator] Sending WhatsApp [${eventType}] to ${phone}...`);

        try {
            // 4. Call WhatsApp Service
            await sendWhatsAppTemplate({
                to: phone,
                templateName: config.templateName,
                languageCode: config.languageCode,
                components
            });

            // 5. Update status to SENT
            await prisma.notification.update({
                where: { id: notification.id },
                data: {
                    status: 'SENT',
                    sentAt: new Date()
                }
            });
            console.log(`[Orchestrator] WhatsApp [${eventType}] sent successfully.`);

        } catch (error: any) {
            // 6. Update status to FAILED
            console.error(`[Orchestrator] Failed to send WhatsApp [${eventType}]:`, error.message);
            await prisma.notification.update({
                where: { id: notification.id },
                data: {
                    status: 'FAILED',
                    failureReason: error.message || 'Meta API error'
                }
            });
        }
    } catch (error: any) {
        console.error(`[Orchestrator] Fatal error in notification flow:`, error);
    }
}
