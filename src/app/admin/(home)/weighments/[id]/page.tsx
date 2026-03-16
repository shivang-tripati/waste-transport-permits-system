'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api/client';
import { Button, StatusBadge, Card, CardContent, Input } from '@/components/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, CheckCircle, XCircle, CreditCard, FileText, AlertCircle } from 'lucide-react';

interface Weighment {
    id: string;
    weighmentNumber: string;
    status: string;
    paymentStatus: string;
    paymentAmount: number | null;
    paymentMethod: string | null;
    paymentReference: string | null;
    firstWeight: number | null;
    secondWeight: number | null;
    netWeight: number | null;
    firstWeighmentAt: string | null;
    secondWeighmentAt: string | null;
    fileUrl: string | null;
    rejectionReason: string | null;
    notes: string | null;
    approvedAt: string | null;
    paidAt: string | null;
    createdAt: string;
    permit: {
        id: string;
        permitNumber: string;
        status: string;
        wasteType: string;
        driverName: string | null;
        driverPhone: string | null;
        vehicleNumber: string | null;
        vehicleType: string | null;
        user: { id: string; name: string; email: string };
        project?: { id: string; name: string; address: string; city: string } | null;
    };
    plant: {
        id: string;
        name: string;
        code: string;
        address: string;
        city: string;
    };
    approvedBy: { id: string; name: string } | null;
    paidBy: { id: string; name: string } | null;
}

// Modal Component
function Modal({
    isOpen,
    onClose,
    title,
    children
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                {children}
            </div>
        </div>
    );
}

export default function WeighmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const weighmentId = params.id as string;

    // Modal states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);

    // Form states
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['weighment', weighmentId],
        queryFn: () => get<Weighment>(`/weighments/${weighmentId}`),
    });

    const markPaidMutation = useMutation({
        mutationFn: (data: { paymentAmount: number; paymentMethod?: string; paymentReference: string }) =>
            post(`/weighments/${weighmentId}/mark-paid`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weighment', weighmentId] });
            queryClient.invalidateQueries({ queryKey: ['weighments'] });
            setShowPaymentModal(false);
            resetPaymentForm();
        },
    });

    const approveMutation = useMutation({
        mutationFn: () => post(`/weighments/${weighmentId}/approve`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weighment', weighmentId] });
            queryClient.invalidateQueries({ queryKey: ['weighments'] });
            setShowApproveConfirm(false);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (data: { reason: string }) =>
            post(`/weighments/${weighmentId}/reject`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weighment', weighmentId] });
            queryClient.invalidateQueries({ queryKey: ['weighments'] });
            setShowRejectModal(false);
            setRejectionReason('');
        },
    });

    const resetPaymentForm = () => {
        setPaymentAmount('');
        setPaymentMethod('');
        setPaymentReference('');
    };

    const handleMarkPaid = (e: React.FormEvent) => {
        e.preventDefault();
        markPaidMutation.mutate({
            paymentAmount: parseFloat(paymentAmount),
            paymentMethod: paymentMethod || undefined,
            paymentReference,
        });
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        rejectMutation.mutate({ reason: rejectionReason });
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading weighment details...</div>;
    }

    if (error || !data?.data) {
        return <div className="p-8 text-center text-red-500">Failed to load weighment</div>;
    }

    const weighment = data.data;
    const isPending = weighment.status === 'PENDING';
    const isPaid = weighment.paymentStatus === 'PAID';
    const isApproved = weighment.status === 'APPROVED';
    const isRejected = weighment.status === 'REJECTED';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{weighment.weighmentNumber}</h1>
                        <p className="text-muted-foreground">Weighment Details</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={weighment.status} />
                    {isPaid && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                            Paid
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            {isPending && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3">
                            {!isPaid && (
                                <Button onClick={() => setShowPaymentModal(true)} variant="secondary">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Mark as Paid
                                </Button>
                            )}
                            {isPaid && (
                                <Button onClick={() => setShowApproveConfirm(true)} variant="primary">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                            )}
                            <Button onClick={() => setShowRejectModal(true)} variant="danger">
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Download PDF Button for Approved Weighments */}
            {isApproved && weighment.fileUrl && (
                <Card>
                    <CardContent className="p-4">
                        <a
                            href={weighment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download Weighment Slip
                        </a>
                    </CardContent>
                </Card>
            )}

            {/* Rejection Reason Alert */}
            {isRejected && weighment.rejectionReason && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-red-800">Rejection Reason</h4>
                                <p className="text-red-700 mt-1">{weighment.rejectionReason}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weighment Details */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Weighment Details
                        </h3>
                        <dl className="space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Weighment No.</dt>
                                <dd className="font-medium">{weighment.weighmentNumber}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Status</dt>
                                <dd><StatusBadge status={weighment.status} /></dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">First Weight</dt>
                                <dd className="font-medium">{weighment.firstWeight ? `${weighment.firstWeight} kg` : '-'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Second Weight</dt>
                                <dd className="font-medium">{weighment.secondWeight ? `${weighment.secondWeight} kg` : '-'}</dd>
                            </div>
                            <div className="flex justify-between border-t pt-3">
                                <dt className="text-gray-600 font-medium">Net Weight</dt>
                                <dd className="font-bold text-lg">{weighment.netWeight ? `${weighment.netWeight} kg` : '-'}</dd>
                            </div>
                            {weighment.firstWeighmentAt && (
                                <div className="flex justify-between text-sm">
                                    <dt className="text-gray-500">First Weighment</dt>
                                    <dd>{new Date(weighment.firstWeighmentAt).toLocaleString()}</dd>
                                </div>
                            )}
                            {weighment.secondWeighmentAt && (
                                <div className="flex justify-between text-sm">
                                    <dt className="text-gray-500">Second Weighment</dt>
                                    <dd>{new Date(weighment.secondWeighmentAt).toLocaleString()}</dd>
                                </div>
                            )}
                            {weighment.notes && (
                                <div className="border-t pt-3">
                                    <dt className="text-gray-600 mb-1">Notes</dt>
                                    <dd className="text-sm bg-gray-50 p-2 rounded">{weighment.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                {/* Payment Details */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Payment Details
                        </h3>
                        <dl className="space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Payment Status</dt>
                                <dd>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${weighment.paymentStatus === 'PAID'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {weighment.paymentStatus}
                                    </span>
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Amount</dt>
                                <dd className="font-medium">
                                    {weighment.paymentAmount
                                        ? `₹${weighment.paymentAmount.toLocaleString('en-IN')}`
                                        : '-'}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Method</dt>
                                <dd>{weighment.paymentMethod || '-'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Reference</dt>
                                <dd className="font-mono text-sm">{weighment.paymentReference || '-'}</dd>
                            </div>
                            {weighment.paidAt && (
                                <div className="flex justify-between text-sm border-t pt-3">
                                    <dt className="text-gray-500">Paid At</dt>
                                    <dd>{new Date(weighment.paidAt).toLocaleString()}</dd>
                                </div>
                            )}
                            {weighment.paidBy && (
                                <div className="flex justify-between text-sm">
                                    <dt className="text-gray-500">Paid By</dt>
                                    <dd>{weighment.paidBy.name}</dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                {/* Permit Details */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Permit Details</h3>
                        <dl className="space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Permit No.</dt>
                                <dd>
                                    <Link href={`/admin/permits/${weighment.permit.id}`} className="text-blue-600 hover:underline font-medium">
                                        {weighment.permit.permitNumber}
                                    </Link>
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Status</dt>
                                <dd><StatusBadge status={weighment.permit.status} /></dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Waste Type</dt>
                                <dd>{weighment.permit.wasteType === 'CND_SEGREGATED' ? 'C&D Segregated' : 'C&D Unsegregated'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Vehicle No.</dt>
                                <dd className="font-medium">{weighment.permit.vehicleNumber || '-'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Driver</dt>
                                <dd>{weighment.permit.driverName || '-'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Driver Phone</dt>
                                <dd>{weighment.permit.driverPhone || '-'}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Plant & Applicant Details */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Plant & Applicant</h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-gray-600 text-sm">Plant</dt>
                                <dd className="font-medium">{weighment.plant.name} ({weighment.plant.code})</dd>
                                <dd className="text-sm text-gray-500">{weighment.plant.address}, {weighment.plant.city}</dd>
                            </div>
                            <div className="border-t pt-3">
                                <dt className="text-gray-600 text-sm">Applicant</dt>
                                <dd className="font-medium">{weighment.permit.user.name}</dd>
                                <dd className="text-sm text-gray-500">{weighment.permit.user.email}</dd>
                            </div>
                            {weighment.permit.project && (
                                <div className="border-t pt-3">
                                    <dt className="text-gray-600 text-sm">Project</dt>
                                    <dd className="font-medium">{weighment.permit.project.name}</dd>
                                    <dd className="text-sm text-gray-500">{weighment.permit.project.address}</dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                {/* Approval Details */}
                {weighment.approvedBy && (
                    <Card className="lg:col-span-2">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Approval Details</h3>
                            <dl className="flex gap-8">
                                <div>
                                    <dt className="text-gray-600 text-sm">Approved By</dt>
                                    <dd className="font-medium">{weighment.approvedBy.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-600 text-sm">Approved At</dt>
                                    <dd className="font-medium">{weighment.approvedAt ? new Date(weighment.approvedAt).toLocaleString() : '-'}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Payment Modal */}
            <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Mark as Paid">
                <form onSubmit={handleMarkPaid} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₹) *</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="Enter amount"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select method</option>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference *</label>
                        <Input
                            type="text"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Transaction ID or receipt number"
                            required
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowPaymentModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={markPaidMutation.isPending}>
                            {markPaidMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                        </Button>
                    </div>
                    {markPaidMutation.isError && (
                        <p className="text-red-500 text-sm">Failed to mark as paid. Please try again.</p>
                    )}
                </form>
            </Modal>

            {/* Reject Modal */}
            <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Weighment">
                <form onSubmit={handleReject} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection (min 10 characters)"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            required
                            minLength={10}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowRejectModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="danger" disabled={rejectMutation.isPending}>
                            {rejectMutation.isPending ? 'Processing...' : 'Confirm Rejection'}
                        </Button>
                    </div>
                    {rejectMutation.isError && (
                        <p className="text-red-500 text-sm">Failed to reject. Please try again.</p>
                    )}
                </form>
            </Modal>

            {/* Approve Confirmation Modal */}
            <Modal isOpen={showApproveConfirm} onClose={() => setShowApproveConfirm(false)} title="Approve Weighment">
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to approve this weighment? This will:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Mark the weighment as APPROVED</li>
                        <li>Mark the associated permit as COMPLETED</li>
                        <li>Generate a PDF weighment slip</li>
                    </ul>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowApproveConfirm(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate()}
                        >
                            {approveMutation.isPending ? 'Processing...' : 'Confirm Approval'}
                        </Button>
                    </div>
                    {approveMutation.isError && (
                        <p className="text-red-500 text-sm">Failed to approve. Please try again.</p>
                    )}
                </div>
            </Modal>
        </div>
    );
}
