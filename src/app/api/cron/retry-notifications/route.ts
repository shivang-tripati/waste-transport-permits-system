// app/api/cron/retry-notifications/route.ts
//
// Registered in vercel.json (see below).
// Also works with node-cron in a standalone worker — just call
// processFailedNotifications() on your schedule directly.

import { NextRequest, NextResponse } from 'next/server';
import { processFailedNotifications } from '@/lib/services/notifications/retryProcessor';
import {log} from '@/lib/logger';

export const runtime = 'nodejs'; // needs prisma + native modules

export async function GET(request: NextRequest) {
    // Guard: only allow calls from Vercel Cron or your internal scheduler.
    // Vercel sets this header automatically on cron invocations.
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const start = Date.now();

    try {
        const result = await processFailedNotifications();

        log.info('[cron/retry-notifications]', {
            ...result,
            durationMs: Date.now() - start,
        });

        return NextResponse.json({
            ok: true,
            ...result,
            durationMs: Date.now() - start,
        });
    } catch (err) {
        log.error('[cron/retry-notifications] fatal error:', err);
        return NextResponse.json(
            { ok: false, error: String(err) },
            { status: 500 }
        );
    }
}