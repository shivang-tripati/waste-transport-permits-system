'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import { Button, StatusBadge, Card, CardContent, Input } from '@/components/ui';
import { Download, AlertCircle } from 'lucide-react';

export default function WeighmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['weighments', page, search],
    queryFn: () => get<any>('/weighments', { page, limit: 10, search }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading weighments...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load weighments</div>;
  }

  const weighments = data?.data || [];
  const meta = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Weighments</h1>
          <p className="text-muted-foreground">View your weighbridge records</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <Input
              placeholder="Search by Weighment Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" variant="secondary">Search</Button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Weighment No.</th>
                  <th className="px-6 py-3 font-medium">Permit</th>
                  <th className="px-6 py-3 font-medium">Plant</th>
                  <th className="px-6 py-3 font-medium">Net Weight</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {weighments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No weighments found.
                    </td>
                  </tr>
                ) : (
                  weighments.map((w: any) => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {w.weighmentNumber}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {w.permit?.permitNumber}
                        <div className="text-xs text-gray-500">{w.permit?.vehicleNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {w.plant?.name}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {w.netWeight ? `${w.netWeight} kg` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={w.status} />
                          {w.paymentStatus === 'PAID' && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                              Paid
                            </span>
                          )}
                        </div>
                        {w.status === 'REJECTED' && w.rejectionReason && (
                          <div className="mt-1 flex items-start gap-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{w.rejectionReason}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {w.status === 'APPROVED' && w.paymentStatus === 'PAID' && w.fileUrl ? (
                          <a
                            href={w.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        ) : w.status === 'APPROVED' && w.paymentStatus !== 'PAID' ? (
                          <span className="text-xs text-orange-600 font-medium">Payment Pending</span>
                        ) : w.status === 'APPROVED' ? (
                          <span className="text-xs text-gray-500">PDF pending</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page === meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
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
