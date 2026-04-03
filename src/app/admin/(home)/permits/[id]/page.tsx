'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, Skeleton } from '@/components/ui';
import { get, post } from '@/lib/api/client';
import Image from 'next/image';

interface PermitDetail {
  id: string;
  permitNumber: string;
  token: string;
  status: string;
  wasteType: string;
  estimatedWeight?: number;
  estimatedVolume?: number;
  wasteDescription?: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupPincode: string;
  driverName?: string;
  driverPhone?: string;
  licenseNumber?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  validFrom?: string;
  validUntil?: string;
  rejectionReason?: string;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  transitStartedAt?: string;
  completedAt?: string;
  project: { id: string; name: string; address: string; city: string; company: { id: string; name: string } };
  plant: { id: string; name: string; code: string; address: string; city: string };
  user: { id: string; name: string; email: string; phone?: string };
  approvedBy?: { id: string; name: string };
  rejectedBy?: { id: string; name: string };
  wasteEvidences: Array<{
    id: string;
    fileName: string;
    filePath: string;
    description?: string;
  }>;
  weighments: Array<{
    id: string;
    weighmentNumber: string;
    status: string;
    firstWeight?: number;
    secondWeight?: number;
    firstWeighmentAt?: string;
    secondWeighmentAt?: string;
    netWeight?: number;
    fileUrl?: string;
    weighedAt?: string;
    plant: { name: string };
  }>;
}

interface QRCodeData {
  qrCode: string;
  verificationUrl: string;
}

export default function AdminPermitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [permit, setPermit] = useState<PermitDetail | null>(null);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showWeighmentModal, setShowWeighmentModal] = useState(false);

  const [validUntil, setValidUntil] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Weighment statelo
  const [weighmentData, setWeighmentData] = useState({
    firstWeight: '',
    firstWeighmentAt: '',
    secondWeight: '',
    secondWeighmentAt: '',
    notes: ''
  });

  // Lightbox state for evidence photos
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    const fetchPermit = async () => {
      try {
        const result = await get<PermitDetail>(`/permits/${id}`);
        if (result.success && result.data) {
          setPermit(result.data);

          if (['APPROVED', 'IN_TRANSIT', 'COMPLETED'].includes(result.data.status)) {
            const qrResult = await get<QRCodeData>(`/permits/${id}/qrcode`);
            if (qrResult.success && qrResult.data) {
              setQrData(qrResult.data);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPermit();
  }, [id]);

  const handleApprove = async () => {
    if (!validUntil) return;
    setActionLoading(true);
    try {
      const result = await post<PermitDetail>(`/permits/${id}/approve`, { validUntil });
      if (result.success && result.data) {
        setPermit(result.data);
        setShowApproveModal(false);
      } else {
        alert(result.error?.message || 'Failed to approve');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (rejectReason.length < 10) return;
    setActionLoading(true);
    try {
      const result = await post<PermitDetail>(`/permits/${id}/reject`, { reason: rejectReason });
      if (result.success && result.data) {
        setPermit(result.data);
        setShowRejectModal(false);
      } else {
        alert(result.error?.message || 'Failed to reject');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTransit = async () => {
    setActionLoading(true);
    try {
      const result = await post<PermitDetail>(`/permits/${id}/transit`, {});
      if (result.success && result.data) {
        setPermit(result.data);
      } else {
        alert(result.error?.message || 'Failed to start transit');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordWeighment = async () => {
    if (!permit) return;
    setActionLoading(true);
    try {
      const result = await post('/weighments', {
        permitId: id,
        plantId: permit.plant.id,
        firstWeight: weighmentData.firstWeight ? parseFloat(weighmentData.firstWeight) : undefined,
        secondWeight: weighmentData.secondWeight ? parseFloat(weighmentData.secondWeight) : undefined,
        notes: weighmentData.notes
      });

      if (result.success) {
        // Refresh permit data to show new weighment
        const refreshResult = await get<PermitDetail>(`/permits/${id}`);
        if (refreshResult.success) setPermit(refreshResult.data ?? null);
        setShowWeighmentModal(false);
        setWeighmentData({ firstWeight: '', firstWeighmentAt: '', secondWeight: '', secondWeighmentAt: '', notes: '' });
      } else {
        alert(result.error?.message || 'Failed to record weighment');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      const result = await post<PermitDetail>(`/permits/${id}/complete`, {});
      if (result.success && result.data) {
        setPermit(result.data);
      } else {
        alert(result.error?.message || 'Failed to complete permit');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!permit) {
    return <div className="text-center py-12">Permit not found</div>;
  }

  const canApprove = ['SUBMITTED', 'UNDER_REVIEW'].includes(permit.status);
  const canReject = ['SUBMITTED', 'UNDER_REVIEW'].includes(permit.status);
  const canStartTransit = permit.status === 'APPROVED';
  const canRecordWeighment = permit.status === 'IN_TRANSIT';
  const canComplete = permit?.status === 'IN_TRANSIT' && permit?.weighments?.length > 0;
  const isPendingReview = canApprove || canReject;

  console.log('permit', permit);

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {/* ─── Sticky Header / Action Bar ─── */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">{permit.permitNumber}</h1>
                <StatusBadge status={permit.status} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5 truncate">by {permit.user?.name} &middot; {new Date(permit.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {/* Desktop action buttons in header */}
          <div className="hidden lg:flex items-center gap-2">
            {canApprove && (
              <Button variant="secondary" size="sm" onClick={() => setShowApproveModal(true)}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Approve
              </Button>
            )}
            {canReject && (
              <Button variant="danger" size="sm" onClick={() => setShowRejectModal(true)}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Reject
              </Button>
            )}
            {canStartTransit && (
              <Button size="sm" onClick={handleStartTransit} isLoading={actionLoading}>Start Transit</Button>
            )}
            {canRecordWeighment && (
              <Button variant="secondary" size="sm" onClick={() => setShowWeighmentModal(true)}>Record Weighment</Button>
            )}
            {canComplete && (
              <Button size="sm" onClick={handleComplete} isLoading={actionLoading}>Mark Completed</Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Quick-glance summary strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Driver & Vehicle — highlighted as most important */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          {/* Driver Name & License */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-indigo-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Driver</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {permit.driverName || "—"}
              </p>
              <p className="text-xs text-indigo-600 font-medium">
                {permit.licenseNumber || "—"}
              </p>
              {permit.driverPhone && (
                <p className="text-xs text-gray-500 mt-0.5">📞 {permit.driverPhone}</p>
              )}
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75h18M3 9.75l1.5-4.5h15l1.5 4.5M3 9.75v9h18v-9M6 18.75a1.5 1.5 0 11-3 0m18 0a1.5 1.5 0 11-3 0" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Vehicle</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {permit.vehicleNumber || "—"}
              </p>
              <p className="text-xs text-gray-500">{permit.vehicleType || "—"}</p>
            </div>
          </div>
        </div>



        {/* Waste Type */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-8">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-amber-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Waste Type</p>
              <div className="mt-1"><StatusBadge status={permit.wasteType} /></div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-teal-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Est. Weight</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{permit.estimatedWeight ? `${permit.estimatedWeight}` : '—'} <span className="text-xs font-normal text-gray-400">kg</span></p>
            </div>
          </div>
        </div>

        {/* Estimated Weight */}
        {/* <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-teal-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Est. Weight</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{permit.estimatedWeight ? `${permit.estimatedWeight}` : '—'} <span className="text-xs font-normal text-gray-400">kg</span></p>
            </div>
          </div>
        </div> */}

        {/* Pickup Location */}
        <div className="col-span-2 lg:col-span-1 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-rose-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Pickup</p>
              <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{permit.project?.name}</p>
              <p className="text-xs text-gray-500 truncate">{permit.pickupCity}, {permit.pickupState}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main content: Evidence-first layout ─── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Left column — Evidence + Details */}
        <div className="lg:col-span-2 space-y-5">

          {/* ======== Waste Evidence (PRIMARY — shown first for quick decisions) ======== */}
          {permit?.wasteEvidences?.length > 0 && (
            <Card className={isPendingReview ? 'ring-2 ring-amber-300 ring-offset-2' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-amber-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-base">Waste Evidence</CardTitle>
                      <p className="text-[11px] text-gray-400 mt-0.5">{permit.wasteEvidences.length} photo{permit.wasteEvidences.length > 1 ? 's' : ''} uploaded</p>
                    </div>
                  </div>
                  {isPendingReview && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Review Required</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {permit.wasteEvidences.map((evidence, idx) => (
                    <button
                      key={evidence.id}
                      onClick={() => setLightboxIdx(idx)}
                      className="group relative aspect-[4/3] border rounded-xl overflow-hidden bg-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-all hover:shadow-lg hover:scale-[1.02]"
                    >
                      <Image
                        src={`/uploads/${evidence.filePath}`}
                        alt={evidence.fileName}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.5" className="opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                        </svg>
                      </div>
                      {evidence?.description && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                          <p className="text-[10px] text-white leading-tight">{evidence.description}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ======== Route & Locations ======== */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pickup</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{permit.project?.name}</p>
                <p className="text-xs text-gray-500">{permit.project?.company?.name}</p>
                <p className="text-xs mt-2 text-gray-500 leading-relaxed">
                  {permit.pickupAddress}<br />
                  {permit.pickupCity}, {permit.pickupState} – {permit.pickupPincode}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Destination</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{permit.plant?.name}</p>
                <p className="text-xs text-gray-500">Code: {permit.plant?.code}</p>
                <p className="text-xs mt-2 text-gray-500 leading-relaxed">
                  {permit.plant?.address}<br />
                  {permit.plant?.city}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ======== Permit Timeline / Dates (Collapsible) ======== */}
          <Card>
            <details className="group">
              <summary className="px-6 py-4 border-b border-gray-200 cursor-pointer list-none flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <CardTitle className="text-sm">Timeline</CardTitle>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-gray-400 transition-transform group-open:rotate-180"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <CardContent>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Created</p>
                    <p className="text-sm font-medium text-gray-700">{new Date(permit.createdAt).toLocaleString()}</p>
                  </div>
                  {permit.submittedAt && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Submitted</p>
                      <p className="text-sm font-medium text-gray-700">{new Date(permit.submittedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {permit.approvedAt && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-green-500 font-semibold">Approved</p>
                      <p className="text-sm font-medium text-gray-700">{new Date(permit.approvedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {permit.transitStartedAt && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-purple-500 font-semibold">Transit Started</p>
                      <p className="text-sm font-medium text-gray-700">{new Date(permit.transitStartedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {permit.completedAt && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">Completed</p>
                      <p className="text-sm font-medium text-gray-700">{new Date(permit.completedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </details>
          </Card>

          {/* ======== Weighment History ======== */}
          {permit?.weighments?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Weighment History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-y">
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Code</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">First/Second/Net (kg)</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Document</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Plant</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {permit.weighments.map((w) => (
                        <tr key={w.id}>
                          <td className="px-4 py-3 font-mono">{w.weighmentNumber}</td>
                          <td className="px-4 py-3 font-medium">
                            {w.firstWeight || '-'}/{w.secondWeight || '-'}/{w.netWeight || '-'} kg
                          </td>
                          <td className="px-4 py-3">
                            {w.fileUrl ? (
                              <a href={w.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                View Slip
                              </a>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{w.plant.name}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {w.weighedAt ? new Date(w.weighedAt).toLocaleString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <StatusBadge status={w.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── Right sidebar: Action panel + QR + Audit ─── */}
        <div className="space-y-5">

          {/* ====== Sticky Action Panel (Approve / Reject) ====== */}
          {isPendingReview && (
            <div className="lg:sticky lg:top-4">
              <Card className="border-gray-300 shadow-md bg-gradient-to-b from-white to-gray-50/80">
                <CardContent className="p-5">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-2">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-amber-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Pending Your Decision</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Review evidence above, then decide</p>
                  </div>

                  {/* Quick summary inside the action panel */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Waste</span>
                      <StatusBadge status={permit.wasteType} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Weight</span>
                      <span className="font-semibold text-gray-700">{permit.estimatedWeight ? `${permit.estimatedWeight} kg` : '—'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Vehicle</span>
                      <span className="font-semibold text-gray-700">{permit.vehicleNumber || '—'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Evidence</span>
                      <span className="font-semibold text-gray-700">{permit.wasteEvidences?.length || 0} photos</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {canApprove && (
                      <Button
                        variant="secondary"
                        className="w-full py-2.5 text-sm font-semibold"
                        onClick={() => setShowApproveModal(true)}
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        Approve Permit
                      </Button>
                    )}
                    {canReject && (
                      <Button
                        variant="danger"
                        className="w-full py-2.5 text-sm font-semibold"
                        onClick={() => setShowRejectModal(true)}
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        Reject Permit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Non-review action buttons (transit, weighment, complete) */}
          {(canStartTransit || canRecordWeighment || canComplete) && (
            <Card>
              <CardContent className="p-4 space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Actions</p>
                {canStartTransit && (
                  <Button className="w-full" onClick={handleStartTransit} isLoading={actionLoading}>
                    Start Transit
                  </Button>
                )}
                {canRecordWeighment && (
                  <Button variant="secondary" className="w-full" onClick={() => setShowWeighmentModal(true)}>
                    Record Weighment
                  </Button>
                )}
                {canComplete && (
                  <Button className="w-full" onClick={handleComplete} isLoading={actionLoading}>
                    Mark Completed
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Driver & Vehicle detail card (sidebar version) */}
          <Card className="border-indigo-100">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-indigo-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <CardTitle className="text-sm">Driver & Vehicle</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Driver</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{permit.driverName || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Phone</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{permit.driverPhone || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Vehicle No.</p>
                  <p className="text-sm font-bold text-indigo-700 mt-0.5 font-mono">{permit.vehicleNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Type</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{permit.vehicleType || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          {qrData && (
            <Card className="border-blue-100 bg-blue-50/20">
              <CardHeader>
                <CardTitle className="text-center text-sm text-blue-900">Digital Permit Token</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Image
                    src={qrData.qrCode}
                    alt="Permit QR"
                    width={180}
                    height={180}
                    className="w-40 h-40"
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-gray-400 font-mono">{permit.token}</p>
                  <p className="text-sm font-bold text-gray-900 border-t pt-2 mt-2">
                    Valid Until: {permit.validUntil ? new Date(permit.validUntil).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Info (Collapsible) */}
          <Card>
            <details className="group">
              <summary className="px-6 py-4 border-b border-gray-200 cursor-pointer list-none flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <CardTitle className="text-sm">Audit Info</CardTitle>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-gray-400 transition-transform group-open:rotate-180"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Created By</p>
                  <p className="text-sm font-medium text-gray-900">{permit.user?.name}</p>
                  <p className="text-xs text-gray-500">{permit.user?.email}</p>
                </div>
                {permit.approvedBy && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-green-500 font-semibold">Approved By</p>
                    <p className="text-sm font-medium">{permit.approvedBy.name}</p>
                  </div>
                )}
                {permit.rejectedBy && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-red-500 font-semibold">Rejected By</p>
                    <p className="text-sm font-medium">{permit.rejectedBy.name}</p>
                    <p className="text-xs text-red-600 mt-1">{permit.rejectionReason}</p>
                  </div>
                )}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500">Internal Reference</p>
                  <p className="text-[10px] font-mono break-all text-gray-400">{permit.id}</p>
                </div>
              </CardContent>
            </details>
          </Card>
        </div>
      </div>

      {/* ─── Evidence Lightbox ─── */}
      {lightboxIdx !== null && permit.wasteEvidences?.[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute -top-3 -right-3 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* Navigation arrows */}
            {permit.wasteEvidences.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIdx((lightboxIdx - 1 + permit.wasteEvidences.length) % permit.wasteEvidences.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={() => setLightboxIdx((lightboxIdx + 1) % permit.wasteEvidences.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}

            <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
              <Image
                src={`/uploads/${permit.wasteEvidences[lightboxIdx].filePath}`}
                alt={permit.wasteEvidences[lightboxIdx].fileName}
                fill
                className="object-contain rounded-xl"
                sizes="90vw"
              />
            </div>

            {/* Description + counter bar */}
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-white/80">
                {permit.wasteEvidences[lightboxIdx].description || permit.wasteEvidences[lightboxIdx].fileName}
              </p>
              <span className="text-xs text-white/50 font-mono">{lightboxIdx + 1} / {permit.wasteEvidences.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modals (unchanged logic) ─── */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader><CardTitle>Approve Permit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                <input
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setShowApproveModal(false)}>Cancel</Button>
                <Button variant="secondary" onClick={handleApprove} isLoading={actionLoading} disabled={!validUntil}>
                  Approve Permit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader><CardTitle>Reject Permit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason * (min 10 chars)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Enter rejection reason..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                <Button variant="danger" onClick={handleReject} isLoading={actionLoading} disabled={rejectReason.length < 10}>
                  Reject Permit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showWeighmentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader><CardTitle>Record Weighment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Weight (kg)</label>
                  <input
                    type="number"
                    value={weighmentData.firstWeight}
                    onChange={(e) => setWeighmentData({ ...weighmentData, firstWeight: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="E.g. 5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Weighment At</label>
                  <input
                    type="datetime-local"
                    value={weighmentData.firstWeighmentAt}
                    onChange={(e) => setWeighmentData({ ...weighmentData, firstWeighmentAt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Second Weight (kg)</label>
                  <input
                    type="number"
                    value={weighmentData.secondWeight}
                    onChange={(e) => setWeighmentData({ ...weighmentData, secondWeight: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="E.g. 2000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Second Weighment At</label>
                  <input
                    type="datetime-local"
                    value={weighmentData.secondWeighmentAt}
                    onChange={(e) => setWeighmentData({ ...weighmentData, secondWeighmentAt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={weighmentData.notes}
                  onChange={(e) => setWeighmentData({ ...weighmentData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setShowWeighmentModal(false)}>Cancel</Button>
                <Button
                  onClick={handleRecordWeighment}
                  isLoading={actionLoading}
                  disabled={!weighmentData.firstWeight && !weighmentData.secondWeight}
                >
                  Record Weighment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Mobile + Tablet sticky bottom action bar ─── */}
      {(isPendingReview || canStartTransit || canRecordWeighment || canComplete) && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex gap-2.5 max-w-lg mx-auto">
            {canReject && (
              <Button
                variant="danger"
                className="flex-1 py-2.5 text-sm font-semibold"
                onClick={() => setShowRejectModal(true)}
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Reject
              </Button>
            )}
            {canApprove && (
              <Button
                variant="secondary"
                className="flex-1 py-2.5 text-sm font-semibold"
                onClick={() => setShowApproveModal(true)}
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Approve
              </Button>
            )}
            {canStartTransit && (
              <Button className="flex-1 py-2.5 text-sm font-semibold" onClick={handleStartTransit} isLoading={actionLoading}>Start Transit</Button>
            )}
            {canRecordWeighment && (
              <Button variant="secondary" className="flex-1 py-2.5 text-sm font-semibold" onClick={() => setShowWeighmentModal(true)}>Record Weighment</Button>
            )}
            {canComplete && (
              <Button className="flex-1 py-2.5 text-sm font-semibold" onClick={handleComplete} isLoading={actionLoading}>Mark Completed</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
