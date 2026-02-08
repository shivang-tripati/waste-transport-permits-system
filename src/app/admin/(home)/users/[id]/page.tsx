"use client"

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api/client';
import {
    Button,
    StatusBadge,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Skeleton
} from '@/components/ui';
import Link from 'next/link';
import {
    User as UserIcon,
    Mail,
    Phone,
    Shield,
    Building2,
    FileText,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight,
    Eye
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface UserDetail extends Record<string, any> {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    company?: {
        id: string;
        name: string;
        registrationNumber?: string;
        projects: Array<{ id: string, name: string, city: string }>;
    };
    identityDocuments: Array<{
        id: string;
        type: string;
        documentNumber: string;
        filePath?: string;
        isVerified: boolean;
    }>;
    recentPermits: Array<{
        id: string;
        permitNumber: string;
        status: string;
        createdAt: string;
        project?: { name: string };
        plant: { name: string };
    }>;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-user-detail', id],
        queryFn: () => get<UserDetail>(`/users/${id}`),
    });

    const updateStatusMutation = useMutation({
        mutationFn: (isActive: boolean) => patch(`/users/${id}`, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-1 h-96" />
                    <Skeleton className="lg:col-span-2 h-96" />
                </div>
            </div>
        );
    }

    if (error || !data?.success || !data.data) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500">Failed to load user details.</p>
                <Link href="/admin/users">
                    <Button variant="ghost" className="mt-4">Back to Users</Button>
                </Link>
            </div>
        );
    }

    const user = data.data;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                    <p className="text-muted-foreground text-sm">User ID: {user.id}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <UserIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Full Name</p>
                                    <p className="font-medium">{user.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email Address</p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            </div>

                            {user.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Phone Number</p>
                                        <p className="font-medium">{user.phone}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">System Role</p>
                                    <div className="flex gap-2 items-center mt-1">
                                        <StatusBadge status={user.role} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Joined On</p>
                                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <p className="text-sm font-medium mb-3">Account Status</p>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {user.isActive ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                        )}
                                        <span className={cn(
                                            "text-sm font-semibold",
                                            user.isActive ? "text-green-700" : "text-red-700"
                                        )}>
                                            {user.isActive ? 'Active' : 'Deactivated'}
                                        </span>
                                    </div>
                                    <Button
                                        variant={user.isActive ? "danger" : "primary"}
                                        size="sm"
                                        className="h-8"
                                        isLoading={updateStatusMutation.isPending}
                                        onClick={() => updateStatusMutation.mutate(!user.isActive)}
                                    >
                                        {user.isActive ? 'Deactivate' : 'Activate'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {user.identityDocuments && user.identityDocuments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Identity Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {user.identityDocuments.map((doc) => (
                                    <div key={doc.id} className="p-4 border rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{doc.type}</p>
                                                <p className="font-mono text-sm mt-1">{doc.documentNumber}</p>
                                            </div>
                                            <StatusBadge status={doc.isVerified ? 'APPROVED' : 'PENDING'} />
                                        </div>

                                        {doc.filePath ? (
                                            <div className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <div className="flex items-center gap-2 truncate text-slate-600">
                                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate text-xs">{doc.filePath}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => window.open(`/uploads/${doc.filePath}`, '_blank')}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-amber-600 italic">No document copy uploaded</p>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Association Card */}
                <div className="lg:col-span-2 space-y-6">
                    {user.role === 'COMPANY_USER' && user.company && (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center text-sm">
                                    <CardTitle>Company Association</CardTitle>
                                    <Link href={`/admin/companies/${user.company.id}`} className="text-blue-600 hover:underline">
                                        View Company
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border text-slate-600">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{user.company.name}</h3>
                                        <p className="text-sm text-gray-500">Registration: {user.company?.registrationNumber || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-slate-400" />
                                        Assigned Projects
                                    </h4>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {user.company?.projects?.map((proj) => (
                                            <Link
                                                key={proj.id}
                                                href={`/admin/projects/${proj.id}`}
                                                className="px-4 py-3 border rounded-xl hover:bg-gray-50 transition-colors flex justify-between items-center group"
                                            >
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">{proj.name}</p>
                                                    <p className="text-xs text-gray-500">{proj.city}</p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm italic py-2">
                                <FileText className="w-5 h-5 text-gray-400" />
                                Recent Permits ({user._count.permits})
                            </CardTitle>
                            <Link href={`/admin/permits?userId=${user.id}`} className="text-xs text-blue-600 hover:underline">
                                View All
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-gray-500 font-medium border-b border-gray-100">
                                        <tr>
                                            <th className="py-3 px-2">Permit #</th>
                                            <th className="py-3 px-2">Project/Plant</th>
                                            <th className="py-3 px-2">Created</th>
                                            <th className="py-3 px-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {user.recentPermits.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-gray-400 italic">No permits found for this user</td>
                                            </tr>
                                        ) : (
                                            user.recentPermits.map((p) => (
                                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-3 px-2">
                                                        <Link href={`/admin/permits/${p.id}`} className="font-bold text-blue-600">
                                                            {p.permitNumber}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <div className="max-w-[200px] truncate">
                                                            <p className="font-medium text-gray-800 truncate">{p.project?.name || 'Self Resource'}</p>
                                                            <p className="text-[10px] text-gray-500 truncate mt-0.5">Dest: {p?.plant?.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-gray-500">
                                                        {new Date(p.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-2 text-right">
                                                        <StatusBadge status={p.status} className="scale-90" />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
