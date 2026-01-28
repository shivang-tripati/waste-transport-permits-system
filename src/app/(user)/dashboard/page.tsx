'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, Skeleton } from '@/components/ui';

interface UserStats {
  totalPermits: number;
  activePermits: number;
  pendingApproval: number;
  completedThisMonth: number;
}

interface RecentPermit {
  id: string;
  permitNumber: string;
  status: string;
  createdAt: string;
  plant: { name: string };
}

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentPermits, setRecentPermits] = useState<RecentPermit[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load stats and recent permits
    const token = localStorage.getItem('accessToken');
    
    fetch('/api/v1/permits?limit=5', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setRecentPermits(result.data || []);
          // Calculate stats from response
          const permits = result.data || [];
          setStats({
            totalPermits: result.pagination?.total || permits.length,
            activePermits: permits.filter((p: RecentPermit) => ['APPROVED', 'IN_TRANSIT'].includes(p.status)).length,
            pendingApproval: permits.filter((p: RecentPermit) => p.status === 'SUBMITTED').length,
            completedThisMonth: permits.filter((p: RecentPermit) => p.status === 'COMPLETED').length,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);
  
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
    { label: 'Total Permits', value: stats?.totalPermits || 0, color: 'text-blue-600' },
    { label: 'Active', value: stats?.activePermits || 0, color: 'text-green-600' },
    { label: 'Pending Approval', value: stats?.pendingApproval || 0, color: 'text-yellow-600' },
    { label: 'Completed', value: stats?.completedThisMonth || 0, color: 'text-purple-600' },
  ];
  
  return (
    <div className="space-y-6">
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
            {recentPermits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No permits yet</p>
                <Link href="/dashboard/permits/new">
                  <Button size="sm" className="mt-2">Create your first permit</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPermits.map((permit) => (
                  <Link
                    key={permit.id}
                    href={`/dashboard/permits/${permit.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-mono text-sm">{permit.permitNumber}</p>
                      <p className="text-xs text-gray-500">{permit.plant.name}</p>
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
