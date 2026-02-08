'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import { Button, StatusBadge, Card, CardContent, Input } from '@/components/ui';
import Link from 'next/link';

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
          <h1 className="text-2xl font-bold tracking-tight">Weighments Management</h1>
          <p className="text-muted-foreground">Monitor weighbridge operations and records</p>
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
                  <th className="px-6 py-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {weighments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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
                        {w.netWeight ? `${w.netWeight} Tons` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={w.status}
                        />
                         {w.paymentStatus === 'PAID' && (
                             <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Paid</span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {new Date(w.createdAt).toLocaleDateString()}
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
