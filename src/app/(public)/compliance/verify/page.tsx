'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Skeleton,
} from '@/components/ui';
import { get } from '@/lib/api/client';
import { Html5QrcodeScanner } from 'html5-qrcode';

/* ---------------- TYPES ---------------- */

interface VerificationData {
  id: string;
  permitNumber: string;
  token: string;
  status: string;
  wasteType: string;
  estimatedWeight?: number;
  pickupAddress: string;
  pickupCity: string;
  driverName?: string;
  vehicleNumber?: string;
  validFrom?: string;
  validUntil?: string;
  project?: {
    name: string;
    company: { name: string };
  };
  plant: {
    name: string;
    code: string;
    address: string;
  };
  verification: {
    validityStatus: 'VALID' | 'NOT_YET_VALID' | 'EXPIRED' | 'NA';
    isActive: boolean;
    checkedAt: string;
  };
}

/* ---------------- COMPONENTS ---------------- */

function DetailRow({ label, value, highlight = false }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-600 uppercase font-bold tracking-wider">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-gray-900'}`}>
        {value || 'N/A'}
      </span>
    </div>
  );
}

function VerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenParam = searchParams.get('token');

  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  /* ---------------- FETCH VERIFICATION ---------------- */

  useEffect(() => {
    if (!tokenParam) return;

    const fetchVerification = async () => {
      setLoading(true);
      try {
        const result = await get<VerificationData>('/verify', { token: tokenParam });
        if (result.success && result.data) {
          setData(result.data);
          setError(null);
        } else {
          setData(null);
          setError(result.error?.message || 'Invalid or expired permit.');
        }
      } catch (err) {
        setData(null);
        setError('System error during verification.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [tokenParam]);

  /* ---------------- LIVE COUNTDOWN TIMER ---------------- */

  useEffect(() => {
    if (!data?.validUntil || data.verification.validityStatus !== 'VALID') {
      setTimeLeft('');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(data.validUntil!).getTime();
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
  }, [data]);

  /* ---------------- QR SCANNER ---------------- */

  useEffect(() => {
    if (!showScanner) return;

    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        let extractedToken = decodedText;
        try {
          const url = new URL(decodedText);
          const t = url.searchParams.get('token');
          if (t) extractedToken = t;
        } catch {
          // Not a URL
        }
        scanner.clear();
        setShowScanner(false);
        router.push(`/compliance/verify?token=${extractedToken}`);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [showScanner, router]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken) router.push(`/compliance/verify?token=${manualToken}`);
  };

  /* ---------------- VIEWS ---------------- */

  if (!tokenParam) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">FIELD VERIFICATION</h1>
            <p className="text-slate-500 font-medium">Scan QR code or enter token to verify trip</p>
          </div>

          <Card className="border-0 shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardContent className="p-8 space-y-6">
              {!showScanner ? (
                <Button
                  className="w-full h-16 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => setShowScanner(true)}
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m0 11V9m-5 5h10M5 8h2m0 0h10m-10 6h10M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></svg>
                  Scan QR Code
                </Button>
              ) : (
                <div className="space-y-4">
                  <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-primary/20" />
                  <Button
                    variant="ghost"
                    className="w-full font-semibold text-slate-600"
                    onClick={() => setShowScanner(false)}
                  >
                    Cancel Scanning
                  </Button>
                </div>
              )}

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                  <span className="px-3 bg-white text-slate-400">Or Manual Entry</span>
                </div>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="relative">
                  <Input
                    placeholder="Enter Token Code"
                    value={manualToken}
                    onChange={e => setManualToken(e.target.value)}
                    required
                    className="h-14 bg-slate-50 border-slate-100 rounded-2xl px-5 text-lg font-mono uppercase focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <Button type="submit" className="w-full h-12 font-bold variant-secondary rounded-xl">
                  Verify Token
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] p-6 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-6">
          <Skeleton className="h-[280px] w-full rounded-3xl" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <div className="bg-rose-500 h-3 w-full" />
          <CardContent className="p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase">Invalid Permit</h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">{error}</p>
            <Button
              className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all"
              onClick={() => router.push('/compliance/verify')}
            >
              Verify Another
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { verification } = data;
  const isActive = verification.isActive;

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Button
          variant="ghost"
          onClick={() => router.push('/compliance/verify')}
          className="hover:bg-white text-slate-500 font-bold tracking-tight rounded-xl group"
        >
          <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span>
          Return to Console
        </Button>

        {/* HERO STATUS CARD */}
        <section className={`relative overflow-hidden rounded-[2.5rem] shadow-2xl border-b-8 ${
          isActive 
            ? 'bg-gradient-to-br from-emerald-500 to-teal-700 border-emerald-900/10' 
            : 'bg-gradient-to-br from-rose-500 to-red-700 border-rose-900/10'
        } text-white`}>
          {/* Background Decorative Element */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-black/10 rounded-full blur-2xl" />

          <div className="relative p-10 flex flex-col items-center text-center space-y-8">
            <div className={`p-5 bg-white/20 backdrop-blur-md rounded-[2rem] border border-white/30 shadow-inner ${isActive ? 'animate-pulse' : ''}`}>
              {isActive ? (
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-5xl font-[1000] tracking-tighter uppercase leading-none">
                {isActive ? 'Permit Valid' : 'Permit Invalid'}
              </h2>
              <p className="text-xl font-bold text-white/90 uppercase tracking-[0.2em]">
                {data.permitNumber}
              </p>
            </div>

            {isActive && timeLeft && (
              <div className="bg-black/20 backdrop-blur-xl px-10 py-5 rounded-[2rem] border border-white/10 shadow-lg group transition-all hover:bg-black/30">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-1">Time Remaining</p>
                <p className="text-5xl font-mono font-black tracking-tighter tabular-nums drop-shadow-sm">
                  {timeLeft}
                </p>
              </div>
            )}

            {!isActive && (
              <div className="bg-white/10 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/10">
                <p className="text-lg font-black uppercase italic tracking-widest">
                  Reason: {verification.validityStatus === 'EXPIRED' ? 'Expired' : 
                         verification.validityStatus === 'NOT_YET_VALID' ? 'Scheduled' : 'Blacklisted'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* DETAILS GRID */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
              <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                Vehicle & Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-1">
              <DetailRow label="Vehicle Number" value={data.vehicleNumber} highlight />
              <DetailRow label="Driver Name" value={data.driverName} />
              <DetailRow label="Waste Type" value={data.wasteType.replace('_', ' ')} />
              <DetailRow label="Est. Weight" value={data.estimatedWeight ? `${data.estimatedWeight} kg` : '—'} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
              <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                Route & Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-1">
              <DetailRow label="Destination" value={data.plant.name} />
              <DetailRow label="Plant Code" value={data.plant.code} />
              <DetailRow label="Starts" value={data.validFrom ? new Date(data.validFrom).toLocaleString() : '—'} />
              <DetailRow label="Expires" value={data.validUntil ? new Date(data.validUntil).toLocaleString() : '—'} />
            </CardContent>
          </Card>
        </div>

        {/* ORIGIN CARD */}
        <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Pickup Origin
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-xl font-black text-slate-900 tracking-tight">
                {data.project?.name || 'Individual Collection'}
              </p>
              <p className="text-slate-500 font-medium">
                {data.project?.company.name}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-4">
                 <div className="p-2 bg-slate-100 rounded-lg">
                   <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </div>
                 <div>
                   <p className="text-sm font-bold text-slate-700 uppercase">Physical Address</p>
                   <p className="text-slate-500 font-medium text-sm">{data.pickupAddress}, {data.pickupCity}</p>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <footer className="pt-8 pb-12 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-200/50 rounded-full">
            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              System Verified At: {new Date(verification.checkedAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
            This digital record is property of MCG Enforcement & Audit Division
          </p>
        </footer>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-400 font-black uppercase tracking-[0.3em] animate-pulse">Initializing Terminal...</div>}>
      <VerificationContent />
    </Suspense>
  );
}
