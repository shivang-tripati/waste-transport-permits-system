"use client"
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import { Button, StatusBadge, Card, CardContent } from '@/components/ui';
import Link from 'next/link';

export default function UsersPage() {
    const [page, setPage] = useState(1);

    const { data, isLoading, error } = useQuery({
        queryKey: ['users', page],
        queryFn: () => get<any>(`/users?page=${page}&limit=10`),
    });

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading users...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Failed to load users</div>;
    }

    const users = data?.data || [];
    const meta = data?.pagination;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
                    <p className="text-muted-foreground">Monitor all registered users (Individuals and Company Users)</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 border-b">
                                <tr>
                                    <th className="px-6 py-3 font-medium">User</th>
                                    <th className="px-6 py-3 font-medium">Role</th>
                                    <th className="px-6 py-3 font-medium">Contact</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-gray-50 bg-white">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{user.name}</div>
                                                <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'COMPANY_USER' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
                                                )}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div>{user.email}</div>
                                                {user.phone && <div className="text-xs">{user.phone}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge
                                                    status={user.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/admin/users/${user.id}`}>
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
                                    variant="outline"
                                    size="sm"
                                    disabled={meta.page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
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

// Helper to avoid import error if cn is not in this file context (it needs import)
import { cn } from '@/lib/cn';
