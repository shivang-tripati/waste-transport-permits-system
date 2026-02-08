'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, StatusBadge, Skeleton } from '@/components/ui';
import Link from 'next/link';
import { get } from '@/lib/api/client';
import {
  FileText,
  Clock,
  Truck,
  CheckCircle2,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalPermits: number;
    pendingApproval: number;
    inTransit: number;
    completedToday: number;
  };
  recentActivity: Array<{
    id: string;
    permitNumber: string;
    status: string;
    userName: string;
    projectName: string;
    updatedAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => get<DashboardData>('/dashboard/stats'),
  });

  if (isLoading) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl">
        <p className="text-red-600 font-medium">Failed to load dashboard data</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-500 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const { stats, recentActivity } = data.data!;

  const statCards = [
    {
      label: 'Total Permits',
      value: stats.totalPermits,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: <FileText className="w-5 h-5 text-blue-600" />
    },
    {
      label: 'Pending Approval',
      value: stats.pendingApproval,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      icon: <Clock className="w-5 h-5 text-yellow-600" />
    },
    {
      label: 'In Transit',
      value: stats.inTransit,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      icon: <Truck className="w-5 h-5 text-purple-600" />
    },
    {
      label: 'Completed Today',
      value: stats.completedToday,
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/admin/permits?status=SUBMITTED"
              className="flex items-center justify-between p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl hover:bg-yellow-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-200 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Review Permits</p>
                  <p className="text-sm text-gray-500">{stats.pendingApproval} permits waiting for approval</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin/weighments?status=PENDING"
              className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Manage Weighments</p>
                  <p className="text-sm text-gray-500">View active vehicle weighments</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/admin/permits" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm italic">No recent activity found</p>
              ) : (
                recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5 border-b last:border-0 border-gray-100 hover:bg-gray-50/50 transition-colors rounded-lg px-2 -mx-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/permits/${item.id}`}
                          className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors"
                        >
                          {item.permitNumber}
                        </Link>
                        <span className="text-[10px] text-gray-400">•</span>
                        <p className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                          {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {item.userName} <span className="text-gray-300 mx-1">/</span> {item.projectName}
                      </p>
                    </div>
                    <div className="ml-4 shrink-0">
                      <StatusBadge status={item.status} className="scale-90" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
