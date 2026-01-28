'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, SkeletonCard } from '@/components/ui';

interface Permit {
  id: string;
  permitNumber: string;
  status: string;
  wasteType: string;
  createdAt: string;
  validUntil?: string;
  project: { id: string; name: string; city: string };
  plant: { id: string; name: string; code: string };
}

function UserPermitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentStatus = searchParams.get('status') || '';
  
  useEffect(() => {
    setLoading(true);
    
    const params = new URLSearchParams();
    params.set('limit', '50');
    if (currentStatus) params.set('status', currentStatus);
    
    const token = localStorage.getItem('accessToken');
    
    fetch(`/api/v1/permits?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setPermits(result.data || []);
        }
      })
      .finally(() => setLoading(false));
  }, [currentStatus]);
  
  const statusFilters = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'In Transit', value: 'IN_TRANSIT' },
    { label: 'Completed', value: 'COMPLETED' },
  ];
  
  const setStatusFilter = (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    router.push(`/dashboard/permits?${params.toString()}`);
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Permits</h1>
        <Link href="/dashboard/permits/new">
          <Button>+ New Permit</Button>
        </Link>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentStatus === filter.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      {/* Permits Grid */}
      {permits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No permits found</p>
            <Link href="/dashboard/permits/new">
              <Button>Create your first permit</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permits.map((permit) => (
            <Link key={permit.id} href={`/dashboard/permits/${permit.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-sm font-medium">{permit.permitNumber}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(permit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={permit.status} />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-500">Project</p>
                      <p className="font-medium">{permit.project.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Plant</p>
                      <p className="font-medium">{permit.plant.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Waste Type</p>
                      <StatusBadge status={permit.wasteType} />
                    </div>
                  </div>
                  
                  {permit.validUntil && (
                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                      Valid until: {new Date(permit.validUntil).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserPermitsPage() {
  return (
    <Suspense fallback={
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    }>
      <UserPermitsContent />
    </Suspense>
  );
}
