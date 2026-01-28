'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, StatusBadge, Skeleton } from '@/components/ui';
import Link from 'next/link';

interface DashboardStats {
  totalPermits: number;
  pendingApproval: number;
  inTransit: number;
  completedToday: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulated stats - in production, fetch from API
    setTimeout(() => {
      setStats({
        totalPermits: 156,
        pendingApproval: 12,
        inTransit: 8,
        completedToday: 23,
      });
      setLoading(false);
    }, 500);
  }, []);
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  const statCards = [
    { label: 'Total Permits', value: stats?.totalPermits, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Approval', value: stats?.pendingApproval, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'In Transit', value: stats?.inTransit, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Completed Today', value: stats?.completedToday, color: 'text-green-600', bg: 'bg-green-50' },
  ];
  
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link 
              href="/admin/permits?status=SUBMITTED"
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pending Approvals</p>
                  <p className="text-sm text-gray-500">Review submitted permits</p>
                </div>
              </div>
              <StatusBadge status="PENDING" />
            </Link>
            
            <Link 
              href="/admin/weighments?status=PENDING"
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pending Weighments</p>
                  <p className="text-sm text-gray-500">Approve weighment records</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Permit approved', permit: 'PT-20260120-ABC12', time: '5 min ago', status: 'APPROVED' },
                { action: 'New permit submitted', permit: 'PT-20260120-DEF34', time: '12 min ago', status: 'SUBMITTED' },
                { action: 'Weighment completed', permit: 'PT-20260119-GHI56', time: '1 hour ago', status: 'COMPLETED' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.action}</p>
                    <p className="text-xs text-gray-500">{item.permit} • {item.time}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
