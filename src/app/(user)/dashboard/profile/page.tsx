'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
    Skeleton,
    StatusBadge,
    FileUpload
} from '@/components/ui';
import { get, patch, post } from '@/lib/api/client';
import Link from 'next/link';
import Image from 'next/image';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    companyId: string | null;
    company?: {
        id: string;
        name: string;
        registrationNumber: string | null;
        gstNumber: string | null;
    } | null;
    identityDocuments?: {
        type: 'AADHAAR' | 'PAN';
        documentNumber: string;
        filePath?: string;
        isVerified: boolean;
    }[];
}

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [pan, setPan] = useState('');
    const [aadhaar, setAadhaar] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await get<UserProfile>('/profile');
            if (res.success && res.data) {
                setProfile(res.data);
                setName(res.data.name);
                setPhone(res.data.phone || '');

                // Set identity docs if present
                const panDoc = res.data.identityDocuments?.find(d => d.type === 'PAN');
                const aadhaarDoc = res.data.identityDocuments?.find(d => d.type === 'AADHAAR');
                if (panDoc) setPan(panDoc.documentNumber);
                if (aadhaarDoc) setAadhaar(aadhaarDoc.documentNumber);
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await patch<UserProfile>('/profile', { name, phone });
            if (res.success) {
                setSuccess('Profile updated successfully');
                // Update local storage user if needed
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const u = JSON.parse(storedUser);
                    u.name = name;
                    u.phone = phone;
                    localStorage.setItem('user', JSON.stringify(u));
                }
            } else {
                setError(res.error?.message || 'Failed to update profile');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateIdentity = async (type: 'PAN' | 'AADHAAR', value: string, filePath?: string) => {
        if (!value) return;
        setUpdating(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await post<any>('/profile/identity', {
                type,
                documentNumber: value,
                filePath
            });
            if (res.success) {
                setSuccess(`${type} updated successfully`);
                fetchProfile(); // Refresh to get verification status
            } else {
                setError(res.error?.message || `Failed to update ${type}`);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64 rounded-md" />
                    <Skeleton className="h-5 w-96 rounded-md" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="shadow-sm border-gray-100">
                            <CardContent className="p-6 space-y-6 mt-4">
                                <Skeleton className="h-14 w-full rounded-xl" />
                                <Skeleton className="h-14 w-full rounded-xl" />
                                <Skeleton className="h-14 w-full rounded-xl" />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6 lg:col-span-1">
                        <Card className="shadow-sm border-gray-100">
                            <CardContent className="p-6 space-y-6 mt-4">
                                <Skeleton className="h-20 w-full rounded-xl" />
                                <Skeleton className="h-20 w-full rounded-xl" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    const isCompanyOnboardingIncomplete = profile?.role === 'COMPANY_USER' && !profile.companyId;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Profile</h1>
                    <p className="text-gray-500 mt-2 text-sm md:text-base">
                        View and manage your personal information and business details.
                    </p>
                </div>
                {profile?.role && (
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
                        {profile.role.replace('_', ' ')}
                    </div>
                )}
            </div>

            {/* Onboarding Alert */}
            {isCompanyOnboardingIncomplete && (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-shrink-0 bg-amber-100 p-2 rounded-full hidden sm:block">
                            <svg className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-amber-700 font-medium">
                                Onboarding Incomplete: You need to register your company to create permits.
                            </p>
                        </div>
                        <div className="flex-shrink-0 mt-2 sm:mt-0">
                            <Link href="/onboarding/company">
                                <Button className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto shadow-sm">
                                    Complete Onboarding
                                    <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Information Form */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <CardHeader className="bg-gray-50 border-b border-gray-100 px-6 py-5">
                            <CardTitle className="text-lg font-semibold text-gray-800">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <Input
                                            label="Full Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            label="Phone Number"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+91..."
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Input
                                        label="Email Address"
                                        value={profile?.email || ''}
                                        disabled
                                        className="bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email address cannot be changed.</p>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex flex-col">
                                        {success && <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-md">{success}</span>}
                                        {error && <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-md">{error}</span>}
                                    </div>
                                    <Button type="submit" disabled={updating} className="w-full sm:w-auto shadow-sm px-6">
                                        {updating ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving Changes...
                                            </span>
                                        ) : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Identity Verification (Individual only) */}
                    {profile?.role === 'INDIVIDUAL' && (
                        <Card className="shadow-sm border-gray-100 overflow-hidden">
                            <CardHeader className="bg-gray-50 border-b border-gray-100 px-6 py-5">
                                <CardTitle className="text-lg font-semibold text-gray-800">Identity Verification</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-10">
                                    <IdentitySection
                                        type="PAN"
                                        label="PAN Card"
                                        doc={profile.identityDocuments?.find(d => d.type === 'PAN')}
                                        onUpdate={handleUpdateIdentity}
                                        updating={updating}
                                    />

                                    <div className="h-px bg-gray-100 w-full rounded-full"></div>

                                    <IdentitySection
                                        type="AADHAAR"
                                        label="Aadhaar Card"
                                        doc={profile.identityDocuments?.find(d => d.type === 'AADHAAR')}
                                        onUpdate={handleUpdateIdentity}
                                        updating={updating}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Account Overview */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <CardHeader className="bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 px-6 py-5">
                            <CardTitle className="text-base font-semibold text-gray-800">Account Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100">
                                <div className="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Role</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-sm font-medium">
                                        {profile?.role.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined On</p>
                                    <p className="text-sm font-medium text-gray-900">January 2026</p>
                                </div>
                                <div className="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-green-50 text-green-700 text-sm font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                        Active
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Company Information */}
                    {profile?.company && (
                        <Card className="shadow-sm border-indigo-100 border overflow-hidden">
                            <div className="h-1 bg-indigo-500 w-full"></div>
                            <CardHeader className="bg-indigo-50/50 border-b border-indigo-50/50 px-6 py-5">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold text-indigo-900">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Company Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                <div>
                                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Company Name</p>
                                    <p className="font-bold text-gray-900 text-lg">{profile.company.name}</p>
                                </div>

                                {profile.company.gstNumber && (
                                    <div className="bg-white rounded-lg border border-indigo-50 p-3">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">GST Number</p>
                                        <p className="text-sm font-medium text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded inline-block">{profile.company.gstNumber}</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <Link href="/onboarding/company">
                                        <Button variant="outline" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 bg-white shadow-sm">
                                            Edit Company Details
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function IdentitySection({
    type,
    label,
    doc,
    onUpdate,
    updating
}: {
    type: 'PAN' | 'AADHAAR',
    label: string,
    doc?: any,
    onUpdate: (type: 'PAN' | 'AADHAAR', value: string, filePath?: string) => void,
    updating: boolean
}) {
    const [value, setValue] = useState(doc?.documentNumber || '');
    const [filePath, setFilePath] = useState(doc?.filePath || '');

    useEffect(() => {
        if (doc) {
            setValue(doc.documentNumber);
            setFilePath(doc.filePath || '');
        }
    }, [doc]);

    return (
        <div className="space-y-4 border-b pb-6 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{label}</h3>
                <StatusBadge
                    status={doc?.isVerified ? 'APPROVED' : doc ? 'PENDING' : 'DRAFT'}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <Input
                        label={`${label} Number`}
                        value={value}
                        onChange={(e) => setValue(type === 'PAN' ? e.target.value.toUpperCase() : e.target.value)}
                        placeholder={type === 'PAN' ? 'ABCDE1234F' : '1234 5678 9012'}
                    />

                    <FileUpload
                        label={`Upload ${label} Copy`}
                        uploadType="identity"
                        accept="image/*,application/pdf"
                        onUploadComplete={(data) => setFilePath(data.path)}
                        helperText="Upload a clear image or PDF"
                    />

                    <Button
                        variant="outline"
                        onClick={() => onUpdate(type, value, filePath)}
                        disabled={updating || !value || !filePath}
                        className="w-full"
                    >
                        {updating ? 'Saving...' : doc ? 'Update Document' : `Save ${label}`}
                    </Button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center border border-dashed border-gray-300 min-h-[150px]">
                    {filePath ? (() => {
                        const ext = filePath.split('.').pop()?.toLowerCase() || '';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
                        const isPdf = ext === 'pdf';

                        if (isImage) {
                            return (
                                <div className="text-center">
                                    <img
                                        src={`/api/uploads/${filePath}`}
                                        alt={`${label} Copy`}
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover rounded"
                                    />
                                    <p className="text-sm font-medium mt-2">Document Attached</p>
                                </div>
                            );
                        }

                        if (isPdf) {
                            return (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium mb-2">PDF Document</p>
                                    <a
                                        href={`/api/uploads/${filePath}`}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download PDF
                                    </a>
                                </div>
                            );
                        }

                        // Fallback for other file types
                        return (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium mb-2">Document Attached</p>
                                <a
                                    href={`/api/uploads/${filePath}`}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download File
                                </a>
                            </div>
                        );
                    })() : (
                        <div className="text-center text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">No document uploaded</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
