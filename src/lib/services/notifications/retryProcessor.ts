/* 
 Called by the cron job every 5 minutes.
 Picks up FAILED notifications whose nextRetryAt <= now,
 re-attempts delivery, then reschedules or dead-letters.

 The retryConfig module defines the retry logic (backoff strategy, max attempts) per priority level.
 The providers module defines the low-level send functions for each channel (WhatsApp, SMS, Email).

 */
import { NotificationStatus, NotificationPriority } from '@prisma/client';
import { prisma } from '@/lib/db';
import {log} from '@/lib/logger';
import {
    sendWhatsAppTemplate,
    sendSMS,
    sendEmail,
    type WhatsAppTemplatePayload,
} from './providers';
import { getNextRetryAt, isExhausted } from './retryConfig';

const BATCH_SIZE = 50;

export interface RetryRunResult {
    processed:    number;
    succeeded:    number;
    rescheduled:  number;
    deadLettered: number;
    errors:       number;
}

export async function processFailedNotifications(): Promise<RetryRunResult> {
    const result: RetryRunResult = {
        processed: 0, succeeded: 0, rescheduled: 0, deadLettered: 0, errors: 0,
    };

    const due = await prisma.notification.findMany({
        where: {
            status:      NotificationStatus.FAILED,
            nextRetryAt: { lte: new Date() },
        },
        orderBy: [
            // CRITICAL < STANDARD alphabetically → CRITICAL processed first
            { priority:    'asc' },
            { nextRetryAt: 'asc' },
        ],
        take: BATCH_SIZE,
    });

    for (const notification of due) {
        result.processed++;

        try {
            const outcome = await attemptDelivery(notification);

            if (outcome.success) {
                await prisma.notification.update({
                    where: { id: notification.id },
                    data: {
                        status:        'SENT',
                        sentAt:        new Date(),
                        failureReason: null,
                        nextRetryAt:   null,
                    },
                });
                result.succeeded++;
            } else {
                const nextCount   = notification.retryCount + 1;
                const priority    = notification.priority as NotificationPriority   ;
                const exhausted   = isExhausted(priority, nextCount);
                const nextRetryAt = exhausted ? null : getNextRetryAt(priority, nextCount);

                await prisma.notification.update({
                    where: { id: notification.id },
                    data: {
                        status:        exhausted ? NotificationStatus.DEAD_LETTER : NotificationStatus.FAILED,
                        retryCount:    nextCount,
                        nextRetryAt,
                        failureReason: outcome.failureReason,
                    },
                });

                if (exhausted) {
                    result.deadLettered++;
                    await alertDeadLetter(notification, outcome.failureReason);
                } else {
                    result.rescheduled++;
                }
            }
        } catch (err) {
            result.errors++;
            log.error(`[retryProcessor] unexpected error on notification ${notification.id}:`, err);
            // Don't let one failure block the rest
            await prisma.notification.update({
                where: { id: notification.id },
                data:  { failureReason: String(err) },
            }).catch(() => {});
        }
    }

    return result;
}

// ---------------------------------------------------------------------------
// Attempt delivery
// Reconstructs the correct provider call from the stored message column.
// ---------------------------------------------------------------------------

type NotificationRow = Awaited<ReturnType<typeof prisma.notification.findMany>>[number];

interface DeliveryOutcome {
    success:        boolean;
    failureReason?: string;
}

async function attemptDelivery(n: NotificationRow): Promise<DeliveryOutcome> {
    switch (n.type) {
        case 'WHATSAPP': {
            if (!n.recipientPhone) {
                return { success: false, failureReason: 'No recipient phone on record' };
            }

            // The orchestrator JSON-serialises the full WhatsAppTemplatePayload
            // into the message column — parse it back here.
            let payload: WhatsAppTemplatePayload;
            try {
                payload = JSON.parse(n.message) as WhatsAppTemplatePayload;
            } catch {
                return {
                    success:       false,
                    failureReason: 'Stored WhatsApp payload is not valid JSON — manual intervention required',
                };
            }

            // Use the DB phone as canonical recipient in case normalisation differed
            const r = await sendWhatsAppTemplate({ ...payload, phone: n.recipientPhone });
            return { success: r.success, failureReason: r.failureReason };
        }

        case 'SMS': {
            if (!n.recipientPhone) {
                return { success: false, failureReason: 'No recipient phone on record' };
            }
            const r = await sendSMS(n.recipientPhone, n.message);
            return { success: r.success, failureReason: r.failureReason };
        }

        case 'EMAIL': {
            if (!n.recipientEmail) {
                return { success: false, failureReason: 'No recipient email on record' };
            }
            const r = await sendEmail(n.recipientEmail, n.subject ?? '(no subject)', n.message);
            return { success: r.success, failureReason: r.failureReason };
        }

        default:
            return { success: false, failureReason: `Unknown notification type: ${n.type}` };
    }
}

// ---------------------------------------------------------------------------
// Dead-letter alert — emails ops when all retries are exhausted
// ---------------------------------------------------------------------------

async function alertDeadLetter(n: NotificationRow, lastError?: string): Promise<void> {
    const opsEmail = process.env.OPS_ALERT_EMAIL;
    if (!opsEmail) return;

    const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://malbafreegurugram.com';
    const subject = `[DEAD LETTER] Notification ${n.id} permanently failed`;

    const html = `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#dc2626">⚠️ Notification Permanently Failed</h2>
  <p>A notification has exhausted all retry attempts and will not be resent automatically.</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin-bottom:24px">
    <tr><td style="padding:6px 16px 6px 0;color:#666;width:120px">ID</td>        <td>${n.id}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666">Type</td>      <td>${n.type}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666">Priority</td>  <td>${n.priority}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666">Recipient</td> <td>${n.recipientPhone ?? n.recipientEmail ?? 'unknown'}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666">Permit ID</td> <td>${n.permitId ?? 'n/a'}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666">Attempts</td>  <td>${n.retryCount}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666">Last error</td><td style="color:#dc2626">${lastError ?? 'unknown'}</td></tr>
  </table>
  <a href="${appUrl}/admin/notifications/${n.id}"
     style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px">
    View in Admin
  </a>
</body>
</html>`;

    await sendEmail(opsEmail, subject, html).catch(err => {
        log.error('[retryProcessor] failed to send dead-letter alert:', err);
    });
}