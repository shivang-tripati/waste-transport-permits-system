"use client"
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import { Button, StatusBadge, Card, CardContent } from '@/components/ui';
import Link from 'next/link';

export default function CompaniesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['companies', page],
    queryFn: () => get<any>(`/companies?page=${page}&limit=10`),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading companies...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load companies</div>;
  }

  const companies = data?.data || [];
  const meta = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies Management</h1>
          <p className="text-muted-foreground">Monitor registered companies and their waste projects</p>
        </div>
        {/* Admin usually doesn't create companies directly in this flow, usually they register themselves, 
            but we could add a create button if needed. For now, strictly listing. 
            User didn't ask for Create Company here, just List & View. */}
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Company</th>
                  <th className="px-6 py-3 font-medium">Contact</th>
                  <th className="px-6 py-3 font-medium">Projects</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No companies found.
                    </td>
                  </tr>
                ) : (
                  companies.map((company: any) => (
                    <tr key={company.id} className="hover:bg-gray-50 bg-white">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{company.name}</div>
                        {company.registrationNumber && (
                          <div className="text-xs text-gray-500">Reg: {company.registrationNumber}</div>
                        )}
                        {company.gstNumber && (
                          <div className="text-xs text-gray-500">GST: {company.gstNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {company.contactEmail && <div>{company.contactEmail}</div>}
                        {company.contactPhone && <div>{company.contactPhone}</div>}
                        <div className="text-xs text-gray-400 mt-1">
                          {company.city}, {company.state}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {company.projects && company.projects.length > 0 ? (
                          <div className="space-y-1">
                            {company.projects.map((p: any) => (
                              <div key={p.id} className="flex items-center text-xs bg-blue-50 text-blue-700 w-fit px-2 py-1 rounded">
                                <span className="font-medium mr-1">{p.name}</span>
                                <span className="text-blue-400 mx-1">•</span>
                                <span className="text-blue-600">{p.city}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No active projects</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={company.isActive ? 'ACTIVE' : 'INACTIVE'}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/companies/${company.id}`}>
                          <Button variant="ghost" size="sm">
                            Details
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
