/**
 * Orchestrates the delivery of template-based notifications across multiple channels.
 * For each event, the notification waterfall is:
 *
 *   1. WhatsApp (Meta template)
 *  2. SMS (Twilio)          — if WhatsApp fails
 *  3. Email (Zoho / Mailtrap) — if BOTH phone channels fail, owner only
 *
 * Every attempt (success or failure) is persisted in the Notification table for auditing and retry purposes.
 * The retryProcessor periodically checks for failed notifications that are due for retry and re-attempts delivery based on the defined retry policy.   
 * 
 **/


/*
 Phones:  owner + driver (if different)
 Email:   owner only
 Every attempt (success or failure) is written to the Notification table.
*/

import { prisma } from '@/lib/db';
import {log} from '@/lib/logger';
import {
    TEMPLATE_REGISTRY,
    renderSMS,
    renderEmail,
    type BusinessEvent,
    type TemplateData,
} from './notifications/templates';
import {
    sendWhatsAppTemplate,
    sendSMS,
    sendEmail,
    normalisePhone,
    type WhatsAppTemplatePayload,
} from './notifications/providers';
import { getNextRetryAt } from './notifications/retryConfig';

// Re-export so route files can import EventType from here without touching internals
export type { BusinessEvent as EventType };
export type { TemplateData };

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface SendTemplateNotificationInput {
    eventType:    BusinessEvent;
    userId:       string;
    phone:        string;           // permit owner — required
    permitId?:    string;           // optional for non-permit events
    data:         TemplateData;
    driverPhone?: string | null;    // also receives WhatsApp + SMS
    userEmail?:   string | null;    // email fallback, owner only
}

/**
 * Fire-and-forget. Call WITHOUT await in route handlers.
 * Catches all errors internally — never throws to the caller.
 */
export async function sendTemplateNotification(
    input: SendTemplateNotificationInput
): Promise<void> {
    try {
        await _dispatch(input);
    } catch (err) {
        log.error('[notificationOrchestrator] unhandled error:', err);
    }
}

// ---------------------------------------------------------------------------
// Core dispatch
// ---------------------------------------------------------------------------

async function _dispatch(input: SendTemplateNotificationInput): Promise<void> {
    const { eventType, userId, phone, permitId, data, driverPhone, userEmail } = input;

    // Guard — catch unregistered events early (will surface in dev logs)
    const config = TEMPLATE_REGISTRY[eventType];
    if (!config) {
        log.error(`[notificationOrchestrator] No template registered for: ${eventType}`);
        return;
    }

    // For PERMIT_APPROVED, fetch the permit token needed for the CTA button URL
    // and optionally a hosted QR image URL.
    let resolvedData = { ...data };

    if (eventType === 'PERMIT_APPROVED' && permitId) {
        const permit = await prisma.permit.findUnique({
            where:  { id: permitId },
            select: { token: true },
        });
        if (permit?.token) {
            resolvedData.token = permit.token;
            // If you host QR images (S3 / GCS), set resolvedData.qrImageUrl here:
            // resolvedData.qrImageUrl = await getHostedQrUrl(permit.token);
        }
    }

    // Build the WhatsApp payload once — reused for every recipient phone
    const waPayload: WhatsAppTemplatePayload = {
        phone:         phone,                           // overwritten per recipient below
        templateName:  config.templateName,
        languageCode:  config.languageCode,
        bodyParams:    config.bodyParams(resolvedData),
        headerParams:  config.headerParams?.(resolvedData),
        buttonParam:   config.buttonParam?.(resolvedData),
        qrImageUrl:    resolvedData.qrImageUrl,
    };

    // Build SMS text once
    const smsText = renderSMS(eventType, resolvedData);

    // Dispatch to all unique phones
    const phones = uniquePhones(phone, driverPhone);
    let atLeastOneDelivered = false;

    for (const recipientPhone of phones) {
        const delivered = await dispatchToPhone({
            recipientPhone,
            waPayload:  { ...waPayload, phone: recipientPhone },
            smsText,
            eventType,
            userId,
            permitId,
        });
        if (delivered) atLeastOneDelivered = true;
    }

    // Email fallback — only if every phone channel failed AND owner has an email
    if (!atLeastOneDelivered && userEmail) {
        const emailContent = renderEmail(eventType, resolvedData);
        await dispatchEmail({
            recipientEmail: userEmail,
            subject:        emailContent.subject,
            html:           emailContent.html,
            userId,
            permitId,
        });
    }
}

// ---------------------------------------------------------------------------
// Per-phone waterfall: WhatsApp → SMS
// Returns true if either channel succeeded.
// ---------------------------------------------------------------------------

async function dispatchToPhone(args: {
    recipientPhone: string;
    waPayload:      WhatsAppTemplatePayload;
    smsText:        string;
    eventType:      BusinessEvent;
    userId:         string;
    permitId?:      string;
}): Promise<boolean> {
    const { recipientPhone, waPayload, smsText, eventType, userId, permitId } = args;

    const priority = eventType === 'PERMIT_APPROVED' ? 'CRITICAL' : 'STANDARD';

    // ── WhatsApp ─────────────────────────────────────────────────────────────
    const waResult = await sendWhatsAppTemplate(waPayload);

    await persistNotification({
        type:          'WHATSAPP',
        status:        waResult.success ? 'SENT' : 'FAILED',
        priority,
        recipientPhone,
        // Store the full payload as JSON — retryProcessor parses it back on retry
        message:       JSON.stringify(waPayload),
        userId,
        permitId,
        sentAt:        waResult.success ? new Date() : undefined,
        failureReason: waResult.failureReason,
        nextRetryAt:   waResult.success ? undefined : getNextRetryAt(priority, 0) ?? undefined,
    });

    if (waResult.success) return true;

    // ── SMS ──────────────────────────────────────────────────────────────────
    const smsResult = await sendSMS(recipientPhone, smsText);

    await persistNotification({
        type:          'SMS',
        status:        smsResult.success ? 'SENT' : 'FAILED',
        priority,
        recipientPhone,
        message:       smsText,
        userId,
        permitId,
        sentAt:        smsResult.success ? new Date() : undefined,
        failureReason: smsResult.failureReason,
        nextRetryAt:   smsResult.success ? undefined : getNextRetryAt(priority, 0) ?? undefined,
    });

    return smsResult.success;
}

// ---------------------------------------------------------------------------
// Email dispatch
// ---------------------------------------------------------------------------

async function dispatchEmail(args: {
    recipientEmail: string;
    subject:        string;
    html:           string;
    userId:         string;
    permitId?:      string;
}): Promise<void> {
    const { recipientEmail, subject, html, userId, permitId } = args;

    const emailResult = await sendEmail(recipientEmail, subject, html);

    await persistNotification({
        type:           'EMAIL',
        status:         emailResult.success ? 'SENT' : 'FAILED',
        priority:       'STANDARD',
        recipientEmail,
        subject,
        message:        html,
        userId,
        permitId,
        sentAt:         emailResult.success ? new Date() : undefined,
        failureReason:  emailResult.failureReason,
        nextRetryAt:    emailResult.success ? undefined : getNextRetryAt('STANDARD', 0) ?? undefined,
    });
}

// ---------------------------------------------------------------------------
// DB persistence
// ---------------------------------------------------------------------------

interface PersistArgs {
    type:            'WHATSAPP' | 'SMS' | 'EMAIL';
    status:          'SENT' | 'FAILED';
    priority:        'CRITICAL' | 'STANDARD' | 'TRANSIENT';
    recipientPhone?: string;
    recipientEmail?: string;
    subject?:        string;
    message:         string;
    userId:          string;
    permitId?:       string;
    sentAt?:         Date;
    failureReason?:  string;
    nextRetryAt?:    Date;
}

async function persistNotification(args: PersistArgs): Promise<void> {
    try {
        await prisma.notification.create({
            data: {
                type:           args.type,
                status:         args.status,
                priority:       args.priority,
                recipientPhone: args.recipientPhone,
                recipientEmail: args.recipientEmail,
                subject:        args.subject,
                message:        args.message,
                userId:         args.userId,
                permitId:       args.permitId,
                sentAt:         args.sentAt,
                failureReason:  args.failureReason,
                retryCount:     0,
                nextRetryAt:    args.nextRetryAt,
            },
        });
    } catch (err) {
        // Never let a DB write failure crash the notification flow
        log.error('[notificationOrchestrator] persistNotification failed:', err);
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniquePhones(...phones: (string | null | undefined)[]): string[] {
    const seen   = new Set<string>();
    const result: string[] = [];
    for (const p of phones) {
        if (!p) continue;
        const normalised = normalisePhone(p);
        if (!seen.has(normalised)) {
            seen.add(normalised);
            result.push(normalised);
        }
    }
    return result;
}