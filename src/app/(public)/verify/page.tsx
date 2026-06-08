'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, Input, Skeleton } from '@/components/ui';
import { get } from '@/lib/api/client';

// --- Types ---

interface VerificationResult {
  id: string;
  permitNumber: string;
  status: string;
  wasteType: string;
  estimatedWeight?: number;
  driverName?: string;
  vehicleNumber?: string;
  validFrom: string;
  validUntil: string;
  project: { name: string; company: { name: string } };
  plant: { name: string };
  verification: {
    validityStatus: 'NOT_YET_VALID' | 'VALID' | 'EXPIRED' | 'NA';
    timeRemaining: { hours: number; minutes: number; text: string } | null;
    isActive: boolean;
    checkedAt: string;
  };
}

// --- Components ---

function VerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Handle manual token submission
  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await get<VerificationResult>(`/verify?token=${token}`);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error?.message || 'Invalid token or permit not found');
        setResult(null);
      }
    } catch (err) {
      setError('An error occurred while verifying');
    } finally {
      setLoading(false);
    }
  };

  // Run verification if token is in URL on mount
  useEffect(() => {
    if (initialToken) {
      handleVerify();
    }
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (!result?.validUntil || result.verification.validityStatus !== 'VALID') {
      setTimeLeft('');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(result.validUntil).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [result]);

  // QR Scanner logic
  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Handle scanned URL or Token
        let scannedToken = decodedText;
        try {
          const url = new URL(decodedText);
          scannedToken = url.searchParams.get('token') || decodedText;
        } catch (e) {
          // Not a URL, use raw text as token
        }

        setToken(scannedToken);
        setScanning(false);
        scanner.clear();

        // Short delay to ensure state update before fetch
        setTimeout(() => {
          router.push(`/verify?token=${scannedToken}`);
          // The initial handleVerify useEffect might not catch this if it already ran, 
          // so we trigger it manually here if needed or let the router state handle it.
          // For simplicity, let's just trigger it:
          const triggerVerify = async () => {
            setLoading(true);
            const res = await get<VerificationResult>(`/verify?token=${scannedToken}`);
            if (res.success && res.data) setResult(res.data);
            setLoading(false);
          };
          triggerVerify();
        }, 100);
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(e => console.error("Scanner clear error", e));
    };
  }, [scanning, router]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-4 md:p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Permit Verification</h1>
        <p className="text-muted-foreground">Enter token or scan QR code to verify trip validity</p>
      </div>

      {/* Input Section */}
      <Card className="border-2 border-primary/10 shadow-lg bg-white/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleVerify} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter Token Code (e.g. TKN-123456)"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-12 text-lg font-mono uppercase"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="lg" disabled={loading || !token}>
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setScanning(!scanning)}
              >
                {scanning ? 'Stop Camera' : 'Scan QR'}
              </Button>
            </div>
          </form>

          {scanning && (
            <div className="mt-6 border-2 border-dashed border-primary/20 rounded-xl overflow-hidden bg-black/5">
              <div id="qr-reader" className="w-full"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-center text-red-600 font-medium">
            {error}
          </CardContent>
        </Card>
      )}

      {loading && !result && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )
      }

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Validity Hero Card */}
          <Card className={`overflow-hidden border-0 shadow-xl ${result.verification.isActive
              ? 'bg-gradient-to-br from-green-600 to-emerald-700 text-white'
              : 'bg-gradient-to-br from-red-600 to-rose-700 text-white'
            }`}>
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-white/20 rounded-full animate-pulse">
                {result.verification.isActive ? (
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              <div>
                <h2 className="text-4xl font-black uppercase tracking-widest mb-1">
                  {result.verification.isActive ? 'Valid Permit' : 'Invalid Permit'}
                </h2>
                <p className="text-white/80 font-medium uppercase tracking-wider">{result.permitNumber}</p>
              </div>

              {result.verification.isActive && timeLeft && (
                <div className="bg-black/20 px-8 py-4 rounded-2xl backdrop-blur-md border border-white/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Time Remaining</p>
                  <p className="text-4xl font-mono font-bold tabular-nums tracking-tighter">
                    {timeLeft}
                  </p>
                </div>
              )}

              {!result.verification.isActive && (
                <div className="bg-white/10 px-6 py-2 rounded-full backdrop-blur-md">
                  <p className="font-bold underline uppercase tracking-wider">
                    Reason: {result.verification.validityStatus === 'EXPIRED' ? 'Validity Expired' :
                      result.verification.validityStatus === 'NOT_YET_VALID' ? 'Trip Not Started Yet' :
                        'Inactive Status (' + result.status + ')'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm border-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                  Vehicle & Waste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Vehicle No" value={result.vehicleNumber} highlight />
                <DetailRow label="Waste Type" value={result.wasteType} />
                <DetailRow label="Est. Weight" value={result.estimatedWeight ? `${result.estimatedWeight} kg` : '-'} />
                <DetailRow label="Driver" value={result.driverName} />
              </CardContent>
            </Card>

            <Card className="shadow-sm border-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Journey
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="From" value={result?.project?.name} />
                <DetailRow label="Owner" value={result?.project?.company?.name} />
                <DetailRow label="To" value={result?.plant?.name} />
                <DetailRow label="Valid Until" value={new Date(result?.validUntil).toLocaleString()} />
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-[10px] text-muted-foreground font-mono">
            Verification Checked At: {new Date(result.verification.checkedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, highlight = false }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value || 'N/A'}
      </span>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading verification flow...</div>}>
        <VerificationContent />
      </Suspense>
    </div>
  );
}
