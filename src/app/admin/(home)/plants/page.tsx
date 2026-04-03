'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import { Button, StatusBadge, Card, CardContent } from '@/components/ui';
import Link from 'next/link';

export default function PlantsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['plants', page],
    queryFn: () => get<any>(`/plants?isActive=true&page=${page}&limit=10`),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading plants...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load plants</div>;
  }

  const plants = data?.data || [];
  const meta = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plants Management</h1>
          <p className="text-muted-foreground">Manage processing plants and destinations</p>
        </div>
        <Link href="/admin/plants/new">
          <Button>+ Add New Plant</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Name / Code</th>
                  <th className="px-6 py-3 font-medium">Location</th>
                  <th className="px-6 py-3 font-medium">Contact</th>
                  <th className="px-6 py-3 font-medium">Capacity</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No plants found.
                    </td>
                  </tr>
                ) : (
                  plants.map((plant: any) => (
                    <tr key={plant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{plant.name}</div>
                        <div className="text-xs text-gray-500">{plant.code}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {plant.city}, {plant.state}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {plant.contactEmail && <div>{plant.contactEmail}</div>}
                        {plant.contactPhone && <div>{plant.contactPhone}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {plant.capacity ? `${plant.capacity} TPD` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={plant.isActive ? 'ACTIVE' : 'INACTIVE'}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/plants/${plant.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
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
