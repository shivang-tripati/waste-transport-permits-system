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

function DetailRow({
  label,
  value,
  icon: Icon,
  highlight = false
}: {
  label: string;
  value?: string;
  icon?: any;
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      {Icon && (
        <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md text-slate-400">
          <Icon className="w-3.5 h-3.5" />
        </div>
      )}
      <div className="flex-1 space-y-0.5">
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</p>
        <p className={`text-sm font-semibold tracking-tight ${highlight ? 'text-primary' : 'text-slate-900'}`}>
          {value || 'N/A'}
        </p>
      </div>
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
      () => { }
    );

    return () => {
      scanner.clear().catch(() => { });
    };
  }, [showScanner, router]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken) router.push(`/compliance/verify?token=${manualToken}`);
  };

  /* ---------------- VIEWS ---------------- */

  if (!tokenParam) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 border-t-4 border-primary">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none mb-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Secure Verification System
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter">Field Audit</h1>
            <p className="text-slate-500 font-medium text-sm">Scan a permit QR code or enter the token manually to verify transport compliance.</p>
          </div>

          <div className="space-y-6">
            {!showScanner ? (
              <Button
                variant="outline"
                className="w-full h-24 border-2 border-slate-100 bg-white hover:border-primary hover:bg-slate-50 rounded-2xl transition-all group flex flex-col items-center justify-center gap-2"
                onClick={() => setShowScanner(true)}
              >
                <div className="p-3 bg-primary/5 rounded-xl text-primary group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m0 11V9m-5 5h10M5 8h2m0 0h10m-10 6h10M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></svg>
                </div>
                <span className="font-bold text-slate-700">Scan Transport Permit</span>
              </Button>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-slate-100" />
                <Button
                  variant="ghost"
                  className="w-full font-bold text-rose-500 hover:bg-rose-50 rounded-xl"
                  onClick={() => setShowScanner(false)}
                >
                  Cancel Scanning
                </Button>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]">
                <span className="px-4 bg-white text-slate-400">Manual Entry</span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="relative group">
                <Input
                  placeholder="Enter Token Code"
                  value={manualToken}
                  onChange={e => setManualToken(e.target.value)}
                  required
                  className="h-14 bg-slate-50 border-slate-100 rounded-xl px-5 text-lg font-mono uppercase focus:border-primary/30 transition-all text-center tracking-widest font-black"
                />
              </div>
              <Button type="submit" className="w-full h-12 font-bold bg-slate-900 hover:bg-primary text-white rounded-xl transition-all">
                Validate Token
              </Button>
            </form>
          </div>

          <footer className="text-center">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">MCG Enforcement Division</p>
          </footer>
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
    <main className="min-h-screen bg-slate-50/50 py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/compliance/verify')}
            className="text-slate-400 hover:text-slate-900 font-bold transition-colors gap-2 px-0 hover:bg-transparent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </Button>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SYSTEM DATE</p>
              <p className="text-xs font-bold text-slate-900">{new Date().toLocaleDateString('en-GB')}</p>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="p-2 bg-white shadow-sm border border-slate-100 rounded-lg">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
          </div>
        </div>

        {/* VERIFICATION HEADER */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
          {/* Authenticity Watermark */}
          <div className="absolute -right-8 -bottom-8 text-[120px] font-black text-slate-50/50 pointer-events-none select-none tracking-tighter leading-none whitespace-nowrap rotate-[-15deg]">
            {isActive ? 'VERIFIED' : 'INVALID'}
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className={`p-6 rounded-2xl flex-shrink-0 ${isActive
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
              {isActive ? (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex items-center flex-wrap justify-center md:justify-start gap-2">
                <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                  {isActive ? 'Permit Verified' : 'Invalid Permit'}
                </h2>
                <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                  {verification.validityStatus}
                </div>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <p className="text-lg font-mono font-bold text-slate-500 uppercase tracking-wider">{data.permitNumber}</p>
                <div className="h-1.5 w-1.5 bg-slate-300 rounded-full" />
                <p className="text-sm font-bold text-slate-400">TOKEN ID: {data.token}</p>
              </div>
            </div>

            {isActive && timeLeft && (
              <div className="w-full md:w-auto bg-slate-900 px-8 py-5 rounded-xl text-center space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest grayscale">TIME REMAINING</p>
                <p className="text-3xl font-mono font-bold text-white tracking-tighter tabular-nums">
                  {timeLeft}
                </p>
              </div>
            )}

            {!isActive && (
              <div className="w-full md:w-auto bg-rose-50 px-6 py-4 rounded-xl border border-rose-100 text-rose-700 font-bold text-center">
                REASON: {verification.validityStatus === 'EXPIRED' ? 'EXPIRED' :
                  verification.validityStatus === 'NOT_YET_VALID' ? 'NOT YET ACTIVE' : 'REJECTED / BLACKLISTED'}
              </div>
            )}
          </div>
        </section>

        {/* INFORMATION GRID */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Permit Payload Details</CardTitle>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight line-clamp-1">Electronic Manifest</span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 gap-x-8">
                <div className="space-y-4">
                  <DetailRow
                    label="Vehicle / Fleet"
                    value={data.vehicleNumber}
                    highlight
                    icon={(props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1m-4 0h1m-1 1v-1m6 1v-1" /></svg>}
                  />
                  <DetailRow
                    label="Authorized Driver"
                    value={data.driverName}
                    icon={(props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  />
                  <DetailRow
                    label="Consolidated ID"
                    value={data.id.split('-')[0].toUpperCase()}
                    icon={(props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 11h.01M7 15h.01M13 7h.01M13 11h.01M13 15h.01M17 7h.01M17 11h.01M17 15h.01" /></svg>}
                  />
                </div>
                <div className="space-y-4">
                  <DetailRow
                    label="Material Category"
                    value={data.wasteType.replace('_', ' ')}
                    icon={(props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                  />
                  <DetailRow
                    label="Load Estimate"
                    value={data.estimatedWeight ? `${data.estimatedWeight} kg` : 'UNSPECIFIED'}
                    icon={(props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
                  />
                  <DetailRow
                    label="Check-in Status"
                    value="PENDING AUDIT"
                    icon={(props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
              <CardTitle className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Security & Ops</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Designated Plant</p>
                <p className="text-sm font-bold text-slate-900 leading-tight">{data.plant.name}</p>
                <p className="text-[10px] font-mono text-slate-500">{data.plant.code}</p>
              </div>
              <div className="pt-4 border-t border-slate-50 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Activation</span>
                  <span className="text-slate-900 font-bold">{data.validFrom ? new Date(data.validFrom).toLocaleDateString() : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Expiry</span>
                  <span className={`font-bold ${isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {data.validUntil ? new Date(data.validUntil).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ORIGIN & TRACEABILITY */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <div className="grid md:grid-cols-3">
            <div className="p-8 md:border-r border-slate-100 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Entity</p>
              <div className="space-y-1">
                <p className="text-xl font-bold text-slate-900 tracking-tight leading-none pt-1">
                  {data.project?.name || 'Authorized Carrier'}
                </p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {data.project?.company.name || 'Individual Collection'}
                </p>
              </div>
            </div>
            <div className="p-8 md:col-span-2 bg-slate-50/30 flex items-start gap-4">
              <div className="p-3 bg-white shadow-sm border border-slate-100 rounded-xl text-slate-400 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Location</p>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                  {data.pickupAddress}, {data.pickupCity}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <footer className="pt-4 pb-12 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
            <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Audit timestamp: {new Date(verification.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>

          {/* <div className="max-w-md text-center space-y-2 opacity-50">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
              Municipal Corporation of Gurgaon • Environmental Enforcement Division
              <br />
              Digital Permit Verification System • v2.4.0-Stable
            </p>
          </div> */}
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
