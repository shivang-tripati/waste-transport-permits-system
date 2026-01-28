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
  StatusBadge,
  Skeleton,
} from '@/components/ui';
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

/* ---------------- MAIN CONTENT ---------------- */

function VerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenParam = searchParams.get('token');

  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  /* ---------------- FETCH VERIFICATION ---------------- */

  useEffect(() => {
    if (!tokenParam) return;

    setLoading(true);
    fetch(`/api/v1/verify?token=${tokenParam}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setData(null);
          setError(result.error?.message || 'Invalid or expired permit.');
        }
      })
      .catch(() => {
        setData(null);
        setError('System error during verification.');
      })
      .finally(() => setLoading(false));
  }, [tokenParam]);

  /* ---------------- RESTORE FOCUS AFTER LOAD ---------------- */

  useEffect(() => {
    const heading = document.getElementById('permit-status');
    heading?.focus();
  }, [data, error]);

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
      // Not a URL, treat as token
    }

    scanner.clear();
    setShowScanner(false);
    router.push(`/verify?token=${extractedToken}`);
  },
  () => {
    // QR scan error callback (ignored intentionally)
    // Required for TypeScript compatibility
  })

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [showScanner, router]);

  /* ---------------- MANUAL SUBMIT ---------------- */

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken) router.push(`/verify?token=${manualToken}`);
  };

  /* =========================================================
     CONSOLE VIEW (NO TOKEN)
     ========================================================= */

  if (!tokenParam) {
    return (
      <main
        id="main-content"
        role="main"
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      >
        <Card className="w-full mb-16 max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verify Transport Permit</CardTitle>
            <p className="text-gray-600">
              Scan QR code or enter permit token
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {!showScanner ? (
              <Button
                className="w-full text-lg py-4"
                onClick={() => setShowScanner(true)}
              >
                Scan QR Code
              </Button>
            ) : (
              <div className="space-y-4">
                <div
                  id="reader"
                  role="region"
                  aria-label="QR code scanner"
                  className="w-full"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowScanner(false)}
                >
                  Cancel Scan
                </Button>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or enter manually
                </span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <label htmlFor="permit-token" className="sr-only">
                Enter permit token
              </label>
              <Input
                id="permit-token"
                placeholder="Enter permit token"
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                required
              />
              <Button type="submit">Verify</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  /* ---------------- ERROR ---------------- */

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-300 bg-red-50">
          <CardContent className="p-8 text-center">
            <h1
              id="permit-status"
              tabIndex={-1}
              className="text-2xl font-bold text-red-800"
            >
              Permit Invalid
            </h1>
            <p className="text-red-700 mt-3">{error}</p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => router.push('/verify')}
            >
              Verify another permit
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  /* =========================================================
     RESULT VIEW (OPTIMIZED FOR OFFICERS)
     ========================================================= */

  const { verification } = data;
  const isActive = verification.isActive;

  return (
    <main
      id="main-content"
      role="main"
      className="min-h-screen bg-gray-100 py-6 px-4"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="outline"
          onClick={() => router.push('/verify')}
          aria-label="Return to permit verification console"
        >
          ← Verify another permit
        </Button>

        {/* STATUS PANEL */}
        <section
          aria-labelledby="permit-status"
          className={`rounded-lg p-6 text-center ${
            isActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <h1
            id="permit-status"
            tabIndex={-1}
            className="text-4xl font-bold tracking-wide"
          >
            {isActive ? 'PERMIT VALID' : 'PERMIT INVALID'}
          </h1>

          <p className="mt-2 text-lg font-medium">
            {verification.validityStatus === 'EXPIRED'
              ? 'Validity Period Expired'
              : verification.validityStatus === 'NOT_YET_VALID'
              ? 'Permit Not Yet Active'
              : isActive
              ? 'Authorized for Transport'
              : 'Not Authorized for Transport'}
          </p>

          {data.validFrom && data.validUntil && (
            <p className="mt-1 text-sm opacity-90">
              Valid from <strong>{new Date(data.validFrom).toLocaleString()}</strong> to{' '}
              <strong>{new Date(data.validUntil).toLocaleString()}</strong>
            </p>
          )}

          <p className="sr-only">
            This permit is {isActive ? 'valid and active' : 'not valid for transport'}.
          </p>
        </section>

        {/* VEHICLE */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Vehicle & Driver</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-lg">
            <div>
              <p className="text-sm text-gray-500">Vehicle Number</p>
              <p className="font-bold tracking-wider">
                {data.vehicleNumber || 'Not Provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Driver Name</p>
              <p className="font-medium">
                {data.driverName || 'Not Provided'}
              </p>
            </div>
          </div>
        </section>

        {/* WASTE */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Waste & Destination</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Waste Type</p>
              <p className="font-medium">
                {data.wasteType.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estimated Quantity</p>
              <p className="font-medium">
                {data.estimatedWeight ?? '—'} kg
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-500">Authorized Destination</p>
            <p className="font-semibold">{data.plant.name}</p>
            <p className="text-sm text-gray-700">{data.plant.address}</p>
          </div>
        </section>

        {/* ORIGIN */}
        <details className="bg-gray-50 rounded border p-4">
          <summary className="cursor-pointer font-medium">
            Pickup / Origin Details
          </summary>
          <div className="mt-3 text-sm">
            <p className="font-medium">
              {data.project ? data.project.name : 'Individual Pickup'}
            </p>
            <p className="text-gray-700">
              {data.pickupAddress}, {data.pickupCity}
            </p>
          </div>
        </details>

        {/* AUDIT FOOTER */}
        <footer className="text-xs text-gray-500 text-center mt-4">
          <p>
            Permit Number:{' '}
            <span className="font-mono">{data.permitNumber}</span>
          </p>
          <p>
            Verified at:{' '}
            {new Date(verification.checkedAt).toLocaleString()}
          </p>
          <p className="mt-2 print:text-black">
            This verification record is system-generated and may be used for
            enforcement and audit purposes.
          </p>
        </footer>
      </div>
    </main>
  );
}

/* ---------------- PAGE EXPORT ---------------- */

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading verification...</div>}>
      <VerificationContent />
    </Suspense>
  );
}
