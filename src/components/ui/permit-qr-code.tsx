'use client';

import { useMemo } from 'react';
import {
    CheckCircle2,
    Copy,
    Download,
    ExternalLink,
    Printer,
    QrCode,
    ScanLine,
    ShieldCheck,
} from 'lucide-react';

interface PermitQrCardProps {
    qrCode: string;
    permitNumber: string;
    verificationUrl: string;
    status?: string;
    authorityName?: string;
}

export function PermitQrCard({
    qrCode,
    permitNumber,
    verificationUrl,
    status,
    authorityName = 'Municipal Corporation',
}: PermitQrCardProps) {
    const formattedStatus = useMemo(() => {
        if (!status) {
            return null;
        }

        return status
            .replaceAll('_', ' ')
            .toLowerCase()
            .replace(/\b\w/g, (character) => character.toUpperCase());
    }, [status]);

    async function copyVerificationUrl() {
        try {
            await navigator.clipboard.writeText(verificationUrl);
        } catch {
            // Clipboard may not be available in every browser context.
        }
    }

    function downloadQrCode() {
        const link = document.createElement('a');

        link.href = qrCode;
        link.download = `permit-${permitNumber}-qr-code.png`;

        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    function printQrCode() {
        window.print();
    }

    return (
        <section className="permit-qr-card mx-auto w-full max-w-xl overflow-hidden border bg-card shadow-sm">
            {/* Header */}
            <header className="border-b bg-primary px-5 py-4 text-white sm:px-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center border border-white/25 bg-white/10">
                            <ShieldCheck
                                className="size-6"
                                aria-hidden="true"
                            />
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/75">
                                Official Digital Permit
                            </p>

                            <h2 className="mt-1 truncate text-lg font-semibold">
                                Permit Verification
                            </h2>
                        </div>
                    </div>

                    <div className="hidden shrink-0 border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-medium sm:block">
                        Secure QR
                    </div>
                </div>
            </header>

            <div className="p-5 sm:p-6">
                {/* Permit information */}
                <div className="mb-5 grid gap-3 border bg-secondary-light p-4 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Permit Number
                        </p>

                        <p className="mt-1 break-all font-mono text-base font-semibold text-foreground">
                            {permitNumber}
                        </p>
                    </div>

                    {formattedStatus && (
                        <div className="sm:text-right">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Current Status
                            </p>

                            <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                                <CheckCircle2
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                {formattedStatus}
                            </div>
                        </div>
                    )}
                </div>

                {/* QR area */}
                <div className="relative mx-auto max-w-sm border bg-white p-4 sm:p-5">
                    <div
                        className="pointer-events-none absolute left-3 top-3 size-6 border-l-2 border-t-2 border-primary"
                        aria-hidden="true"
                    />

                    <div
                        className="pointer-events-none absolute right-3 top-3 size-6 border-r-2 border-t-2 border-primary"
                        aria-hidden="true"
                    />

                    <div
                        className="pointer-events-none absolute bottom-3 left-3 size-6 border-b-2 border-l-2 border-primary"
                        aria-hidden="true"
                    />

                    <div
                        className="pointer-events-none absolute bottom-3 right-3 size-6 border-b-2 border-r-2 border-primary"
                        aria-hidden="true"
                    />

                    <img
                        src={qrCode}
                        alt={`QR code for permit ${permitNumber}`}
                        className="mx-auto block aspect-square h-auto w-full max-w-[320px]"
                    />

                    <div className="mt-3 flex items-center justify-center gap-2 border-t pt-3 text-center text-xs font-medium text-muted-foreground">
                        <ScanLine
                            className="size-4 text-primary"
                            aria-hidden="true"
                        />
                        Scan using any supported QR-code scanner
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-5 flex gap-3 border-l-4 border-primary bg-primary-light p-4">
                    <QrCode
                        className="mt-0.5 size-5 shrink-0 text-primary"
                        aria-hidden="true"
                    />

                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            Verify this permit before processing
                        </p>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Scan the QR code to confirm the permit status,
                            validity, and associated compliance information.
                        </p>
                    </div>
                </div>

                {/* Verification URL */}
                <div className="mt-5">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Verification Link
                    </p>

                    <div className="flex items-stretch border bg-secondary-light">
                        <p className="min-w-0 flex-1 truncate px-3 py-2.5 text-sm text-foreground">
                            {verificationUrl}
                        </p>

                        <button
                            type="button"
                            onClick={copyVerificationUrl}
                            className="inline-flex shrink-0 items-center justify-center border-l px-3 text-primary transition-colors hover:bg-primary-light focus-visible:outline-none"
                            aria-label="Copy verification link"
                            title="Copy verification link"
                        >
                            <Copy
                                className="size-4"
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="permit-qr-actions mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                        type="button"
                        onClick={downloadQrCode}
                        className="inline-flex min-h-10 items-center justify-center gap-2 border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                        <Download
                            className="size-4"
                            aria-hidden="true"
                        />
                        Download
                    </button>

                    <button
                        type="button"
                        onClick={printQrCode}
                        className="inline-flex min-h-10 items-center justify-center gap-2 border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                    >
                        <Printer
                            className="size-4"
                            aria-hidden="true"
                        />
                        Print
                    </button>

                    <a
                        href={verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center justify-center gap-2 border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                    >
                        <ExternalLink
                            className="size-4"
                            aria-hidden="true"
                        />
                        Verify
                    </a>
                </div>

                {/* Authority */}
                <footer className="mt-6 border-t pt-4 text-center">
                    <p className="text-xs leading-5 text-muted-foreground">
                        Digitally generated by{' '}
                        <span className="font-semibold text-foreground">
                            {authorityName}
                        </span>
                    </p>

                    <p className="text-xs leading-5 text-muted-foreground">
                        This QR code does not replace the official permit record.
                    </p>
                </footer>
            </div>
        </section>
    );
}