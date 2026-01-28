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


export async function uploadEvidenceAsync(
    permitId: string,
    files: any[],
    token: string | null
) {
    try {
        await Promise.all(
            files.map(async (fileData) => {
                const res = await fetch(
                    `/api/v1/permits/${permitId}/evidence`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            permitId,
                            fileName: fileData.fileName,
                            filePath: fileData.path,
                            fileSize: fileData.size,
                            mimeType: fileData.mimeType,
                            description: 'Initial evidence',
                        }),
                    }
                );

                if (!res.ok) {
                    throw new Error('Evidence upload failed');
                }
            })
        );
    } catch (e) {
        console.error('Evidence upload failed:', e);
        throw new Error('Evidence upload failed');
    }
}
