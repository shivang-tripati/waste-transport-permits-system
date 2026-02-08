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

  // Weighment state
  const [weighmentData, setWeighmentData] = useState({
    firstWeight: '',
    secondWeight: '',
    notes: ''
  });

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
        if (refreshResult.success) setPermit(refreshResult.data);
        setShowWeighmentModal(false);
        setWeighmentData({ firstWeight: '', secondWeight: '', notes: '' });
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

  console.log('permit', permit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold mt-2">{permit.permitNumber}</h1>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <Button variant="secondary" onClick={() => setShowApproveModal(true)}>
              Approve
            </Button>
          )}
          {canReject && (
            <Button variant="danger" onClick={() => setShowRejectModal(true)}>
              Reject
            </Button>
          )}
          {canStartTransit && (
            <Button onClick={handleStartTransit} isLoading={actionLoading}>
              Start Transit
            </Button>
          )}
          {canRecordWeighment && (
            <Button variant="secondary" onClick={() => setShowWeighmentModal(true)}>
              Record Weighment
            </Button>
          )}
          {canComplete && (
            <Button onClick={handleComplete} isLoading={actionLoading}>
              Mark Completed
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Permit Details</CardTitle>
                <StatusBadge status={permit?.status} />
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Waste Type</p>
                <StatusBadge status={permit?.wasteType} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium text-gray-900">{permit?.user?.name}</p>
                <p className="text-xs text-gray-500">{permit?.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Weight</p>
                <p className="font-medium">{permit?.estimatedWeight ? `${permit?.estimatedWeight} kg` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium text-gray-900">{new Date(permit?.createdAt).toLocaleString()}</p>
              </div>

              {permit?.submittedAt && (
                <div>
                  <p className="text-sm text-gray-500">Submitted At</p>
                  <p className="font-medium text-gray-900">{new Date(permit?.submittedAt).toLocaleString()}</p>
                </div>
              )}
              {permit?.approvedAt && (
                <div>
                  <p className="text-sm text-gray-500">Approved At</p>
                  <p className="font-medium text-gray-900">{new Date(permit?.approvedAt).toLocaleString()}</p>
                </div>
              )}
              {permit?.transitStartedAt && (
                <div>
                  <p className="text-sm text-gray-500">Transit Started At</p>
                  <p className="font-medium text-gray-900">{new Date(permit?.transitStartedAt).toLocaleString()}</p>
                </div>
              )}
              {permit?.completedAt && (
                <div>
                  <p className="text-sm text-gray-500">Completed At</p>
                  <p className="font-medium text-gray-900">{new Date(permit?.completedAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Locations */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pickup Location</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{permit?.project?.name}</p>
                <p className="text-sm text-gray-500">{permit?.project?.company?.name}</p>
                <p className="text-sm mt-3 text-gray-600">
                  {permit?.pickupAddress}<br />
                  {permit?.pickupCity}, {permit?.pickupState} - {permit?.pickupPincode}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Destination Plant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{permit?.plant?.name}</p>
                <p className="text-sm text-gray-500">Code: {permit?.plant?.code}</p>
                <p className="text-sm mt-3 text-gray-600">
                  {permit?.plant?.address}<br />
                  {permit?.plant?.city}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Driver & Vehicle */}
          <Card>
            <CardHeader>
              <CardTitle>Driver & Vehicle</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Driver Name</p>
                <p className="font-medium">{permit?.driverName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Driver Phone</p>
                <p className="font-medium">{permit?.driverPhone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vehicle Number</p>
                <p className="font-medium">{permit?.vehicleNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vehicle Type</p>
                <p className="font-medium">{permit?.vehicleType || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Evidence */}
          {permit?.wasteEvidences?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Waste Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {permit?.wasteEvidences?.map((evidence) => (
                    <div key={evidence.id} className="relative aspect-square border rounded-lg overflow-hidden bg-gray-100">
                      <div className="w-full max-w-sm">
                        <Image
                          src={`/uploads/${evidence.filePath}`}
                          alt={evidence.fileName}
                          width={800} // Target "natural" resolution
                          height={450}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>

                      {evidence?.description && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/50 p-1 text-[10px] text-white">
                          {evidence.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weighments */}
          {permit?.weighments?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Weighment History</CardTitle>
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
                      {permit?.weighments?.map((w) => (
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

        {/* Sidebar */}
        <div className="space-y-6">
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

          {/* User History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Audit Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {permit.approvedBy && (
                <div>
                  <p className="text-xs text-gray-500">Approved By</p>
                  <p className="text-sm font-medium">{permit.approvedBy.name}</p>
                </div>
              )}
              {permit.rejectedBy && (
                <div>
                  <p className="text-xs text-gray-500 text-red-600">Rejected By</p>
                  <p className="text-sm font-medium">{permit.rejectedBy.name}</p>
                  <p className="text-xs text-red-600 mt-1">{permit.rejectionReason}</p>
                </div>
              )}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">Internal Reference</p>
                <p className="text-[10px] font-mono break-all text-gray-400">{permit.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Second Weight (kg)</label>
                  <input
                    type="number"
                    value={weighmentData.secondWeight}
                    onChange={(e) => setWeighmentData({ ...weighmentData, secondWeight: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="E.g. 2000"
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
    </div>
  );
}
