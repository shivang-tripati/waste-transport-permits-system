'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import {  get } from '@/lib/api/client';
import { Button, StatusBadge, Card, CardContent } from '@/components/ui';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ['company', id],
    queryFn: () => get<any>(`/companies/${id}`),
    retry: false,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading company details...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">Company not found or error loading details</div>
        <Button onClick={() => router.push('/admin/companies')}>Back to List</Button>
      </div>
    );
  }

  const company = data.data;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link href="/admin/companies" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Companies
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <StatusBadge status={company.isActive ? 'ACTIVE' : 'INACTIVE'}  />
          <span className="text-muted-foreground text-sm">Created on {new Date(company.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Company Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Registration Number</p>
                <p className="font-medium">{company.registrationNumber || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">GST Number</p>
                <p className="font-medium">{company.gstNumber || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Contact Email</p>
                <p className="font-medium">{company.contactEmail || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Contact Phone</p>
                <p className="font-medium">{company.contactPhone || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Address</p>
                <p className="font-medium">
                  {company.address}
                  {company.city && `, ${company.city}`}
                  {company.state && `, ${company.state}`}
                  {company.pincode && ` - ${company.pincode}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Active Projects</p>
                <p className="text-2xl font-bold text-blue-800">
                  {company.projects?.filter((p: any) => p.isActive).length || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-purple-800">
                   {company._count?.users || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Projects</h3>
          {company.projects && company.projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 border-b">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Location</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {company.projects.map((project: any) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{project.name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {project.city}, {project.state}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={project.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No projects found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
