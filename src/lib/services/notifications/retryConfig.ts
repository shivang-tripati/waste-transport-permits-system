// lib/services/notifications/retryConfig.ts
//
// Centralised retry policy. Tweak the numbers here — nothing else needs to change.

export interface RetryPolicy {
    maxAttempts: number;
    // Delay in minutes before each retry attempt (index = attempt number, 0-based)
    backoffMinutes: number[];
}

// CRITICAL permits (approved/rejected) retry aggressively.
// STANDARD permits use gentler backoff.
// TRANSIENT items (low-value pings) get one quick retry then give up.
export const RETRY_POLICIES: Record<'CRITICAL' | 'STANDARD' | 'TRANSIENT', RetryPolicy> = {
    CRITICAL: {
        maxAttempts: 5,
        backoffMinutes: [2, 8, 30, 120, 480], // 2m, 8m, 30m, 2h, 8h
    },
    STANDARD: {
        maxAttempts: 3,
        backoffMinutes: [10, 60, 360],         // 10m, 1h, 6h
    },
    TRANSIENT: {
        maxAttempts: 1,
        backoffMinutes: [5],
    },
};

/**
 * Returns the Date when the next retry should run,
 * or null if the notification has exhausted all attempts.
 */
export function getNextRetryAt(
    priority: 'CRITICAL' | 'STANDARD' | 'TRANSIENT',
    retryCount: number  // number of attempts already made (0-based count of failures)
): Date | null {
    const policy = RETRY_POLICIES[priority];
    if (retryCount >= policy.maxAttempts) return null;

    const delayMs = (policy.backoffMinutes[retryCount] ?? policy.backoffMinutes.at(-1)!) * 60_000;
    return new Date(Date.now() + delayMs);
}

/**
 * True when a notification should be promoted to DEAD_LETTER status
 * (all retries exhausted).
 */
export function isExhausted(
    priority: 'CRITICAL' | 'STANDARD' | 'TRANSIENT',
    retryCount: number
): boolean {
    return retryCount >= RETRY_POLICIES[priority].maxAttempts;
}