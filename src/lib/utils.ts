import { post } from "./api/client";
import {log} from '@/lib/logger';
/**
 * Generate permit number with format: PT-YYYYMMDD-XXXXX
 */
export function generatePermitNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `PT-${dateStr}-${random}`;
}

/**
 * Generate weighment number with format: WM-YYYYMMDD-XXXXX
 */
export function generateWeighmentNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `WM-${dateStr}-${random}`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Calculate time remaining from now to a future date
 */
export function getTimeRemaining(futureDate: Date | string): {
    expired: boolean;
    hours: number;
    minutes: number;
    text: string;
} {
    const now = new Date().getTime();
    const target = new Date(futureDate).getTime();
    const diff = target - now;

    if (diff <= 0) {
        return { expired: true, hours: 0, minutes: 0, text: 'Expired' };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = '';
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        text = `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
        text = `${hours}h ${minutes}m remaining`;
    } else {
        text = `${minutes}m remaining`;
    }

    return { expired: false, hours, minutes, text };
}

/**
 * Parse URL search params to filter object
 */
export function parseFilters(searchParams: URLSearchParams, allowedFields: string[]): Record<string, string> {
    const filters: Record<string, string> = {};

    for (const field of allowedFields) {
        const value = searchParams.get(field);
        if (value) {
            filters[field] = value;
        }
    }

    return filters;
}


export const normalizeDateTime = (val: unknown): Date | null => {
    if (!val || val === "") return null;

    if (typeof val === "string") {
        // "2026-01-28T06:33" → "2026-01-28T06:33:00"
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
            return new Date(`${val}:00`);
        }

        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
    }

    return null;
};

export const formatForDatetimeLocal = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

export const toDateTimeLocalValue = (val?: string | null) => {
  if (!val) return '';

  const date = new Date(val);

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);

  return localDate.toISOString().slice(0, 16);
};


export function parsePermitDateTime(value: string): Date {

    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
    const hasSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);

    const normalized = hasTimezone
        ? value
        : `${value}${hasSeconds ? '' : ':00'}+05:30`;

    return new Date(normalized);
}

export async function uploadEvidenceAsync(
    permitId: string,
    files: any[]
) {
    try {
        await Promise.all(
            files.map((fileData) =>
                post(`/permits/${permitId}/evidence`, {
                    permitId,
                    fileName: fileData.fileName,
                    filePath: fileData.path,
                    fileSize: fileData.size,
                    mimeType: fileData.mimeType,
                    description: "Initial evidence",
                })
            )
        );
    } catch (e) {
        log.error("Evidence upload failed:", e);
        throw new Error("Evidence upload failed");
    }
}


export const getEvidenceUrl = (path: string) => {
    return `${process.env.NEXT_PUBLIC_FILE_BASE_URL}/${path}`;
};

export const getPermitDuration = (
  start?: string,
  end?: string
) => {
  if (!start || !end) return "-";

  const diff =
    new Date(end).getTime() -
    new Date(start).getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(
    (diff % (1000 * 60 * 60)) / (1000 * 60)
  );

  return `${hours}h ${minutes}m`;
};
