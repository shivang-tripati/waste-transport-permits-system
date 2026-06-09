'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, Skeleton } from '@/components/ui';
import { get, post } from '@/lib/api/client';
import Image from 'next/image';
import { CarIcon, GlobeIcon, LocateFixed, LocateIcon } from 'lucide-react';
import { toPng } from "html-to-image";
import { useRef } from "react";
import { getEvidenceUrl, getPermitDuration } from '@/lib/utils';

import { PermitDetail } from '@/types';

interface QRCodeData {
  qrCode: string;
  verificationUrl: string;
}

export default function UserPermitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [permit, setPermit] = useState<PermitDetail | null>(null);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const permitRef = useRef<HTMLDivElement>(null);


  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitData, setSubmitData] = useState({
    driverName: '',
    driverPhone: '',
    vehicleNumber: '',
    vehicleType: ''
  });

  useEffect(() => {
    const fetchPermit = async () => {
      try {
        const result = await get<PermitDetail>(`/permits/${id}`);
        if (result.success && result.data) {
          setPermit(result.data);

          console.log("permit", result.data);

          // Pre-fill submit data if available
          setSubmitData({
            driverName: result.data.driverName || '',
            driverPhone: result.data.driverPhone || '',
            vehicleNumber: result.data.vehicleNumber || '',
            vehicleType: result.data.vehicleType || ''
          });

          // If approved, fetch QR code
          if (result.data.status === 'APPROVED' || result.data.status === 'IN_TRANSIT') {
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

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      const result = await post<PermitDetail>(`/permits/${id}/submit`, submitData);
      if (result && result.data) {
        setPermit(result.data);
        setShowSubmitModal(false);
      } else {
        alert(result.error?.message || 'Failed to submit permit');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // const handleStartTransit = async () => {
  //   setActionLoading(true);
  //   try {
  //     const result = await post<PermitDetail>(`/permits/${id}/transit`, {});
  //     if (result.success && result.data) {
  //       setPermit(result.data);
  //     } else {
  //       alert(result.error?.message || 'Failed to start transit');
  //     }
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };

  const handleDownload = async () => {
    if (!permitRef.current) return;

    try {
      const dataUrl = await toPng(permitRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `permit-${permit?.permitNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
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

  const isDraft = permit.status === 'DRAFT';
  const isApproved = ['APPROVED', 'IN_TRANSIT', 'COMPLETED'].includes(permit.status);
  const canStartTransit = permit.status === 'APPROVED';

  return (
    <>
      <div className="printable-permit">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button className="no-print" variant="ghost" size="sm" onClick={() => router.back()}>
              ← Back
            </Button>
            <h1 className="text-2xl font-bold mt-2">{permit.permitNumber || 'Permit Detail'}</h1>
          </div>
          <div className="flex gap-2 no-print">
            {isDraft && (
              <Button onClick={() => setShowSubmitModal(true)} isLoading={actionLoading}>
                Submit for Approval
              </Button>
            )}
            {/* {isApproved && (
              <Button variant="secondary" onClick={() => window.print()}>
                Print Permit
              </Button>
            )} */}
            {/* {canStartTransit && (
              <Button onClick={handleStartTransit} isLoading={actionLoading}>
                Start Transit
              </Button>
            )} */}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className='flex items-center gap-2'>
                    <GlobeIcon className='text-primary' size={20} />
                    <CardTitle>Overview</CardTitle>
                  </div>
                  <StatusBadge status={permit.status} />
                </div>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Waste Type</p>
                  <StatusBadge status={permit.wasteType} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Requested Weight</p>
                  <p className="font-medium">{permit.estimatedWeight ? `${permit.estimatedWeight} kg` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">{new Date(permit.createdAt).toLocaleString()}</p>
                </div>
                {permit.submittedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Submitted At</p>
                    <p className="font-medium">{new Date(permit.submittedAt).toLocaleString()}</p>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className='flex items-center gap-2'>
                        <GlobeIcon className='text-primary' size={20} />
                        <CardTitle>Overview</CardTitle>
                      </div>
                      <StatusBadge status={permit.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Waste Type</p>
                      <StatusBadge status={permit.wasteType} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Requested Weight</p>
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
                          <p className="font-medium">
                            {new Date(permit.validFrom).toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Valid Until</p>
                          <p className="font-medium">
                            {new Date(permit.validUntil).toLocaleString()}
                          </p>
                        </div>

                        <div className="md:col-span-2 rounded-lg bg-blue-50 border border-blue-100 p-3">
                          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                            Requested Duration
                          </p>
                          <p className="text-sm font-semibold text-blue-900 mt-1">
                            {getPermitDuration(permit.validFrom, permit.validUntil)}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Locations */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className='flex flex-row items-center gap-2'>
                  <LocateIcon className='text-primary' size={20} />
                  <CardTitle>Pickup Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{permit.project?.name}</p>
                  <p className="text-sm text-gray-500">{permit.project?.company?.name}</p>
                  <p className="text-sm mt-3 text-gray-600">
                    {permit.pickupAddress}<br />
                    {permit.pickupCity}, {permit.pickupState} - {permit.pickupPincode}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center gap-2'>
                  <LocateFixed className='text-primary' size={20} />
                  <CardTitle>Destination Plant</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{permit.plant?.name}</p>
                  <p className="text-sm text-gray-500">Code: {permit.plant?.code}</p>
                  <p className="text-sm mt-3 text-gray-600">
                    {permit.plant?.address}<br />
                    {permit.plant?.city}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Vehicle Info */}
            <Card>
              <CardHeader className='flex flex-row items-center gap-2'>
                <CarIcon className='text-primary' size={20} />
                <CardTitle>Transporter & Vehicle</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Vehicle Number</p>
                  <p className="font-medium">{permit.vehicleNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle Type</p>
                  <p className="font-medium">{permit.vehicleType || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Driver Name</p>
                  <p className="font-medium">{permit.driverName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Driver Phone</p>
                  <p className="font-medium">{permit.driverPhone || '-'}</p>
                </div>
              </CardContent>
            </Card>


            {permit.wasteEvidences?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Waste Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {permit.wasteEvidences.map((e) => (
                      <div key={e.id} className="relative group">
                        <div className="w-full max-w-sm">
                          <img
                            src={`/api/uploads/${e.filePath}`}
                            alt={e.fileName}
                            width={800} // Target "natural" resolution
                            height={450}
                            className="w-full h-auto rounded-lg"
                          />
                        </div>
                        {e?.description && (
                          <div className="absolute bottom-0 inset-x-0 bg-black/50 p-1 text-[10px] text-white">
                            {e.description}
                          </div>
                        )}
                        <a
                          href={getEvidenceUrl(e.filePath)}
                          target="_blank"
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <span className="text-white text-sm font-medium">
                            View
                          </span>
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weighments */}
            {permit?.weighments?.length > 0 && (
              <Card>
                <CardHeader className='flex flex-row items-center gap-2'>
                  <LocateIcon className='text-primary' size={20} />
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
                                <a href={w.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  PDF
                                </a>
                              ) : '-'}
                            </td>
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

          {/* Sidebar Info */}
          <div className="space-y-6 mb-20 md:mb-0">
            {/* Validity QR */}
            <div>
              {isApproved && qrData && (
                console.log("VERIFICATION URL:", qrData.verificationUrl),
                <>
                  <div ref={permitRef}>
                    <Card className="border-blue-100 bg-blue-50/30">
                      <CardHeader>
                        <CardTitle className="text-center text-blue-900">Digital Permit</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                          <img
                            src={qrData.qrCode}
                            alt="Permit QR Code"
                            width={200}
                            height={200}
                            className="w-48 h-48"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-blue-700 font-medium uppercase tracking-wider mb-1">Validity</p>
                          <p className="font-bold text-gray-900">
                            {permit.validUntil ? new Date(permit.validUntil).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <div className="w-full pt-4 border-t border-blue-100">
                          <p className="text-[10px] text-center text-blue-600 break-all leading-tight">
                            {qrData.verificationUrl}
                          </p>
                        </div>
                      </CardContent>

                    </Card>
                  </div>


                  <Button
                    onClick={handleDownload}
                    className="w-full mt-4 no-print"
                    variant="secondary"
                  >
                    Download
                  </Button>
                </>
              )}
            </div>

            <div>

            </div>

            {/* Rejection Note */}
            {permit.status === 'REJECTED' && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800">Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700 font-medium">{permit.rejectionReason || 'No reason provided.'}</p>
                  <p className="text-sm mt-4 text-red-600/80 italic">
                    Please review the application guidelines and submit a new permit with corrected information.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Status</span>
                    <StatusBadge status={permit.status} />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Permit No</span>
                    <span className="font-mono font-medium">{permit.permitNumber || 'PENDING'}</span>
                  </div>
                  {permit.approvedAt && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Approved At</span>
                      <span className="font-medium">{new Date(permit.approvedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Submit Permit for Approval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">Please confirm or enter transporter details before submitting.</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Driver Name *</label>
                  <input
                    type="text"
                    value={submitData.driverName}
                    onChange={(e) => setSubmitData({ ...submitData, driverName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g. Rahul Kumar"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Driver Phone *</label>
                  <input
                    type="text"
                    value={submitData.driverPhone}
                    onChange={(e) => setSubmitData({ ...submitData, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g. +919000000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Number *</label>
                  <input
                    type="text"
                    value={submitData.vehicleNumber}
                    onChange={(e) => setSubmitData({ ...submitData, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g. HR 26 AB 1234"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    value={submitData.vehicleType}
                    onChange={(e) => setSubmitData({ ...submitData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g. Tipper Truck"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  isLoading={actionLoading}
                  disabled={!submitData.driverName || !submitData.driverPhone || !submitData.vehicleNumber}
                >
                  Confirm & Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html,
          body {
            width: 100%;
            min-height: auto;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print,
          .no-print * {
            display: none !important;
          }

          .printable-permit {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
            background: #fff !important;
            color: #000 !important;
          }

          .printable-permit * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .printable-permit .card,
          .printable-permit .card > * {
            box-shadow: none !important;
            border-color: #ccc !important;
          }

          .printable-permit .overflow-x-auto {
            overflow: visible !important;
          }

          .printable-permit table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .printable-permit th,
          .printable-permit td {
            padding: 0.35rem !important;
          }

          .printable-permit img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
          }

          .printable-permit .grid,
          .printable-permit .flex {
            gap: 0.5rem !important;
          }

          .printable-permit .space-y-6 > *,
          .printable-permit .space-y-4 > *,
          .printable-permit .space-y-3 > * {
            margin-top: 0.5rem !important;
          }

          .printable-permit .space-x-2 > * {
            margin-left: 0.5rem !important;
          }

          .printable-permit .text-2xl {
            font-size: 1.35rem !important;
          }

          .printable-permit .text-sm {
            font-size: 0.78rem !important;
          }

          .printable-permit .text-xs {
            font-size: 0.7rem !important;
          }

          .printable-permit h1 {
            font-size: 1.4rem !important;
            margin-bottom: 0.25rem !important;
          }
        }
      `}</style>
    </>
  );
}

