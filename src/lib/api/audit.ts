import { prisma } from '@/lib/db';
import { EntityType, AuditAction } from '@prisma/client';

export interface AuditLogParams {
    entityType: EntityType;
    entityId: string;
    action: AuditAction;
    performedByUserId: string;
    metadata?: Record<string, any>;
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                entityType: params.entityType,
                entityId: params.entityId,
                action: params.action,
                performedByUserId: params.performedByUserId,
                metadata: params.metadata ?? null as any,
                previousState: params.previousState ?? null as any,
                newState: params.newState ?? null as any,
                ipAddress: params.ipAddress ?? null,
                userAgent: params.userAgent ?? null,
            },
        });
    } catch (error) {
        // Log error but don't fail the main operation
        console.error('Failed to create audit log:', error);
    }
}

/**
 * Helper to extract IP address from request headers
 */
export function getClientIP(headers: Headers): string | undefined {
    return (
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get('x-real-ip') ||
        undefined
    );
}

/**
 * Helper to get user agent from request
 */
export function getUserAgent(headers: Headers): string | undefined {
    return headers.get('user-agent') || undefined;
}
