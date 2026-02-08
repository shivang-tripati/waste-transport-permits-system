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
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isCompanyOnboardingIncomplete = profile?.role === 'COMPANY_USER' && !profile.companyId;

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Profile</h1>
                <p className="text-gray-500">Manage your personal and business information.</p>
            </div>

            {isCompanyOnboardingIncomplete && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-amber-700 font-medium">
                                Onboarding Incomplete: You need to register your company to create permits.
                            </p>
                            <Link href="/onboarding/company" className="mt-2 text-sm text-amber-700 underline font-bold block">
                                Complete Onboarding Now →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Personal Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <Input
                                    label="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <Input
                                    label="Email Address"
                                    value={profile?.email || ''}
                                    disabled
                                    className="bg-gray-50"
                                />
                                <Input
                                    label="Phone Number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+91..."
                                />
                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={updating}>
                                        {updating ? 'Saving...' : 'Update Profile'}
                                    </Button>
                                    {success && <span className="text-sm text-green-600 font-medium">{success}</span>}
                                    {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {profile?.role === 'INDIVIDUAL' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Identity Verification</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-8">
                                    <IdentitySection
                                        type="PAN"
                                        label="PAN Card"
                                        doc={profile.identityDocuments?.find(d => d.type === 'PAN')}
                                        onUpdate={handleUpdateIdentity}
                                        updating={updating}
                                    />

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

                {/* Account Status / Company Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Account Role</p>
                                <p className="font-medium text-blue-700">{profile?.role.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Member Since</p>
                                <p className="text-sm">January 2026</p>
                            </div>
                        </CardContent>
                    </Card>

                    {profile?.company && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Business Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="font-bold text-gray-900">{profile.company.name}</p>
                                {profile.company.gstNumber && (
                                    <p className="text-sm text-gray-500">GST: {profile.company.gstNumber}</p>
                                )}
                                <Link href="/onboarding/company">
                                    <Button variant="ghost" size="sm" className="w-full mt-2">Edit Company Details</Button>
                                </Link>
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
                    {filePath ? (
                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-2 truncate max-w-[200px]">Path: {filePath}</p>
                            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium mt-2">Document Attached</p>
                        </div>
                    ) : (
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
