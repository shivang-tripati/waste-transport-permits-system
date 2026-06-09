'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, Skeleton } from '@/components/ui';
import { get } from '@/lib/api/client';

interface UserDashboardData {
  stats: {
    totalPermits: number;
    activePermits: number;
    pendingApproval: number;
    completedThisMonth: number;
  };
  recentActivity: Array<{
    id: string;
    permitNumber: string;
    status: string;
    projectName: string;
    plantName: string;
    updatedAt: string;
  }>;
}

export default function UserDashboardPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasIdentityDocs, setHasIdentityDocs] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await get<UserDashboardData>('/dashboard/user-stats');
        if (result.success) {
          setData(result.data || null);
        }
        
        // Check for identity documents if user is individual
        if (user?.role === 'INDIVIDUAL') {
          const profileResult = await get<any>('/profile');
          if (profileResult.success && profileResult.data?.identityDocuments) {
            setHasIdentityDocs(profileResult.data.identityDocuments.length > 0);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Permits', value: data?.stats.totalPermits || 0, color: 'text-blue-600' },
    { label: 'Active', value: data?.stats.activePermits || 0, color: 'text-green-600' },
    { label: 'Pending Approval', value: data?.stats.pendingApproval || 0, color: 'text-yellow-600' },
    { label: 'Completed', value: data?.stats.completedThisMonth || 0, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Onboarding Banner - Company */}
      {user && user.role === 'COMPANY_USER' && !user.companyId && pathname !== '/dashboard/profile' && !pathname.includes('onboarding') && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-900">Onboarding Incomplete</p>
              <p className="text-sm text-red-700">You must register your company and create a project before you can apply for permits to transport waste.</p>
            </div>
          </div>
          <Link href="/onboarding/company">
            <Button variant="outline" size="sm" className="bg-white border-red-200 text-red-700 hover:bg-red-50">
              Complete Setup
            </Button>
          </Link>
        </div>
      )}

      {/* Onboarding Banner - Individual */}
      {user && user.role === 'INDIVIDUAL' && !hasIdentityDocs && pathname !== '/dashboard/profile' && !pathname.includes('onboarding') && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-900">Verification Required</p>
              <p className="text-sm text-amber-700">Please upload your Aadhaar and PAN card to verify your identity and start creating permits.</p>
            </div>
          </div>
          <Link href="/onboarding/profile">
            <Button variant="outline" size="sm" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50">
              Verify Now
            </Button>
          </Link>
        </div>
      )}

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-gray-500">Here's what's happening with your permits.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/dashboard/permits/new"
              className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Create New Permit</p>
                  <p className="text-sm text-gray-500">Start a new transport permit</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/dashboard/permits"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">View All Permits</p>
                  <p className="text-sm text-gray-500">See your permit history</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Permits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Permits</CardTitle>
            <Link href="/dashboard/permits" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {!data || data.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No permits yet</p>
                <Link href="/dashboard/permits/new">
                  <Button size="sm" className="mt-2">Create your first permit</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.map((permit) => (
                  <Link
                    key={permit.id}
                    href={`/dashboard/permits/${permit.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-mono text-sm">{permit.permitNumber}</p>
                      <p className="text-xs text-gray-500">{permit.plantName}</p>
                    </div>
                    <StatusBadge status={permit.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
