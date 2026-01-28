import { cn } from '@/lib/cn';
import { PermitStatus, WeighmentStatus, PaymentStatus } from '@prisma/client';

type StatusType = PermitStatus | WeighmentStatus | PaymentStatus | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Permit statuses
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-300',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  APPROVED: 'bg-green-100 text-green-700 border-green-300',
  IN_TRANSIT: 'bg-purple-100 text-purple-700 border-purple-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  EXPIRED: 'bg-orange-100 text-orange-700 border-orange-300',
  REJECTED: 'bg-red-100 text-red-700 border-red-300',
  CANCELLED: 'bg-gray-200 text-gray-600 border-gray-400',
  
  // Weighment/Payment statuses
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  PAID: 'bg-green-100 text-green-700 border-green-300',
  FAILED: 'bg-red-100 text-red-700 border-red-300',
  REFUNDED: 'bg-blue-100 text-blue-700 border-blue-300',
  
  // Validity statuses
  VALID: 'bg-green-100 text-green-700 border-green-300',
  NOT_YET_VALID: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  NA: 'bg-gray-100 text-gray-700 border-gray-300',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  IN_TRANSIT: 'In Transit',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  VALID: 'Valid',
  NOT_YET_VALID: 'Not Yet Valid',
  NA: 'N/A',
  CND_SEGREGATED: 'C&D Segregated',
  CND_UNSEGREGATED: 'C&D Unsegregated',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.DRAFT;
  const label = statusLabels[status] || status;
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
