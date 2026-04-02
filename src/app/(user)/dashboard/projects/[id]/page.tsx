'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import { Button, StatusBadge, Card, CardContent } from '@/components/ui';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => get<any>(`/projects/${id}`),
    retry: false,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading project details...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">Project not found or error loading details</div>
        <Button onClick={() => router.push('/admin/projects')}>Back to List</Button>
      </div>
    );
  }

  const project = data.data;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link href="/admin/projects" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Projects
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={project.isActive ? 'ACTIVE' : 'INACTIVE'}  />
              <span className="text-muted-foreground text-sm">Created on {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right">
             <p className="text-sm text-gray-500">Company</p>
             <Link href={`/admin/companies/${project.company?.id}`} className="text-lg font-semibold text-blue-600 hover:underline">
               {project.company?.name}
             </Link>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Project Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Project Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Description</p>
                <p className="font-medium">{project.description || 'No description provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium">{project.city}, {project.state}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pincode</p>
                  <p className="font-medium">{project.pincode}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Address</p>
                <p className="font-medium">{project.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">Latitude</p>
                  <p className="font-medium">{project.latitude || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Longitude</p>
                  <p className="font-medium">{project.longitude || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Activity Overview</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Permits Issued</p>
                  <p className="text-3xl font-bold text-blue-800">
                    {project._count?.permits || 0}
                  </p>
                </div>
                <div className="text-blue-200">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Recent Permits</p>
                {project.permits && project.permits.length > 0 ? (
                  <div className="space-y-2">
                    {project.permits.slice(0, 5).map((permit: any) => (
                      <div key={permit.id} className="flex justify-between items-center text-xs border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{permit.permitNumber}</p>
                          <p className="text-gray-400">{new Date(permit.createdAt).toLocaleDateString()}</p>
                        </div>
                        <StatusBadge status={permit.status}/>
                      </div>
                    ))}
                    {project.permits.length > 5 && (
                      <p className="text-center text-xs text-blue-600 mt-2">View all permits</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No permits found for this project</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
