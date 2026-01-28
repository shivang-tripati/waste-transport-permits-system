'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, Skeleton } from '@/components/ui';

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
  project: { id: string; name: string; address: string; city: string; company: { id: string; name: string } };
  plant: { id: string; name: string; code: string; address: string; city: string };
  user: { id: string; name: string; email: string; phone?: string };
  approvedBy?: { id: string; name: string };
  rejectedBy?: { id: string; name: string };
  weighments: Array<{
    id: string;
    weighmentNumber: string;
    status: string;
    netWeight?: number;
    weighedAt?: string;
  }>;
}

export default function AdminPermitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [permit, setPermit] = useState<PermitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [validUntil, setValidUntil] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    fetch(`/api/v1/permits/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setPermit(result.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);
  
  const handleApprove = async () => {
    if (!validUntil) return;
    
    setActionLoading(true);
    const token = localStorage.getItem('accessToken');
    
    try {
      const res = await fetch(`/api/v1/permits/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ validUntil }),
      });
      
      const result = await res.json();
      if (result.success) {
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
    const token = localStorage.getItem('accessToken');
    
    try {
      const res = await fetch(`/api/v1/permits/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      
      const result = await res.json();
      if (result.success) {
        setPermit(result.data);
        setShowRejectModal(false);
      } else {
        alert(result.error?.message || 'Failed to reject');
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
        </div>
      </div>
      
      {/* Status & Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Permit Details</CardTitle>
            <StatusBadge status={permit.status} />
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Waste Type</p>
            <StatusBadge status={permit.wasteType} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Created By</p>
            <p className="font-medium">{permit.user.name}</p>
            <p className="text-sm text-gray-500">{permit.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estimated Weight</p>
            <p className="font-medium">{permit.estimatedWeight ? `${permit.estimatedWeight} kg` : '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="font-medium">{new Date(permit.createdAt).toLocaleString()}</p>
          </div>
          {permit.validFrom && permit.validUntil && (
            <>
              <div>
                <p className="text-sm text-gray-500">Valid From</p>
                <p className="font-medium">{new Date(permit.validFrom).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valid Until</p>
                <p className="font-medium">{new Date(permit.validUntil).toLocaleString()}</p>
              </div>
            </>
          )}
          {permit.approvedBy && (
            <div>
              <p className="text-sm text-gray-500">Approved By</p>
              <p className="font-medium">{permit.approvedBy.name}</p>
            </div>
          )}
          {permit.rejectionReason && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Rejection Reason</p>
              <p className="font-medium text-red-600">{permit.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Driver & Vehicle */}
      <Card>
        <CardHeader>
          <CardTitle>Driver & Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Driver Name</p>
            <p className="font-medium">{permit.driverName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Driver Phone</p>
            <p className="font-medium">{permit.driverPhone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Vehicle Number</p>
            <p className="font-medium">{permit.vehicleNumber || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Vehicle Type</p>
            <p className="font-medium">{permit.vehicleType || '-'}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Locations */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pickup Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{permit.project.name}</p>
            <p className="text-sm text-gray-500">{permit.project.company.name}</p>
            <p className="text-sm mt-2">
              {permit.pickupAddress}, {permit.pickupCity}, {permit.pickupState} - {permit.pickupPincode}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Destination Plant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{permit.plant.name}</p>
            <p className="text-sm text-gray-500">Code: {permit.plant.code}</p>
            <p className="text-sm mt-2">
              {permit.plant.address}, {permit.plant.city}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Weighments */}
      {permit.weighments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weighments</CardTitle>
          </CardHeader>
          <CardContent>
            {permit.weighments.map((w) => (
              <div key={w.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{w.weighmentNumber}</p>
                  <p className="text-sm text-gray-500">
                    Net Weight: {w.netWeight ? `${w.netWeight} kg` : 'Pending'}
                  </p>
                </div>
                <StatusBadge status={w.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Approve Permit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until *
                </label>
                <input
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowApproveModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  isLoading={actionLoading}
                  onClick={handleApprove}
                  disabled={!validUntil}
                >
                  Approve Permit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Permit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Enter reason (minimum 10 characters)"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  isLoading={actionLoading}
                  onClick={handleReject}
                  disabled={rejectReason.length < 10}
                >
                  Reject Permit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
