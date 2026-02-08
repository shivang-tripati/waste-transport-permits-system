'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, Skeleton, SkeletonTable } from '@/components/ui';
import { get } from '@/lib/api/client';

interface Permit {
  id: string;
  permitNumber: string;
  status: string;
  wasteType: string;
  driverName?: string;
  vehicleNumber?: string;
  createdAt: string;
  project: { id: string; name: string; city: string };
  plant: { id: string; name: string; code: string };
  user: { id: string; name: string; email: string };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function PermitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [permits, setPermits] = useState<Permit[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const currentStatus = searchParams.get('status') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    setLoading(true);

    const fetchPermits = async () => {
      try {
        const result = await get<Permit[]>('/permits', {
          page: currentPage,
          limit: 10,
          status: currentStatus || undefined
        });
        if (result.success) {
          setPermits(result.data || []);
          setPagination(result.pagination || null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPermits();
  }, [currentStatus, currentPage]);

  const statusFilters = [
    { label: 'All', value: '' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'In Transit', value: 'IN_TRANSIT' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  const setStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    router.push(`/admin/permits?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentStatus === filter.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Permits</h1>
        <Link href="/dashboard/permits/new">
          <Button>+ New Permit</Button>
        </Link>
      </div>

      {/* Permits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Permits</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonTable rows={5} />
          ) : permits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No permits found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-500 text-sm">Permit #</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">Status</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">Project</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">Plant</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">Driver</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">Created</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm"></th>
                  </tr>
                </thead>
                <tbody>
                  {permits.map((permit) => (
                    <tr key={permit.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3">
                        <span className="font-mono text-sm">{permit.permitNumber}</span>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={permit.status} />
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-sm">{permit?.project?.name}</p>
                          <p className="text-xs text-gray-500">{permit?.project?.city}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-sm">{permit?.plant?.name}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm">{permit.driverName || '-'}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-gray-500">
                          {new Date(permit.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link href={`/dashboard/permits/${permit.id}`}>
                          <Button size="sm" variant="ghost">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('page', String(pagination.page - 1));
                    router.push(`/dashboard/permits?${params.toString()}`);
                  }}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('page', String(pagination.page + 1));
                    router.push(`/dashboard/permits?${params.toString()}`);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPermitsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={8} />}>
      <PermitsContent />
    </Suspense>
  );
}
