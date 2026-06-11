// lib/services/notifications/persistNotification.ts
//
// Replaces the inline persistNotification() inside notificationOrchestrator.ts.
// Now stamps nextRetryAt when a notification fails for the first time so the
// retry processor picks it up immediately on the next cron tick.

import { prisma } from '@/lib/db';
import { getNextRetryAt } from './retryConfig';
import {log} from '@/lib/logger';

export interface PersistArgs {
    type:            'WHATSAPP' | 'SMS' | 'EMAIL';
    status:          'SENT' | 'FAILED';
    priority:        'CRITICAL' | 'STANDARD' | 'TRANSIENT';
    recipientPhone?: string;
    recipientEmail?: string;
    subject?:        string;
    message:         string;
    userId:          string;
    permitId:        string;
    sentAt?:         Date;
    failureReason?:  string;
}

export async function persistNotification(args: PersistArgs): Promise<void> {
    try {
        // On first failure retryCount = 0, schedule the first retry
        const nextRetryAt =
            args.status === 'FAILED'
                ? getNextRetryAt(args.priority, 0) // attempt 0 just failed → schedule attempt 1
                : null;

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
                nextRetryAt,
            },
        });
    } catch (err) {
        log.error('[persistNotification] failed to persist:', err);
    }
}