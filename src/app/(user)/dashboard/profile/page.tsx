
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
    StatusBadge
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
            const res = await get<UserProfile>('/api/v1/profile');
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
            const res = await patch<UserProfile>('/api/v1/profile', { name, phone });
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

    const handleUpdateIdentity = async (type: 'PAN' | 'AADHAAR', value: string) => {
        if (!value) return;
        setUpdating(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await post<any>('/api/v1/profile/identity', { type, documentNumber: value });
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
                                <div className="space-y-4">
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <Input 
                                                label="PAN Number" 
                                                value={pan} 
                                                onChange={(e) => setPan(e.target.value.toUpperCase())}
                                                placeholder="ABCDE1234F"
                                            />
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleUpdateIdentity('PAN', pan)}
                                            disabled={updating}
                                        >
                                            Save
                                        </Button>
                                        <StatusBadge 
                                            status={profile.identityDocuments?.find(d => d.type === 'PAN')?.isVerified ? 'APPROVED' : 'PENDING'} 
                                        />
                                    </div>

                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <Input 
                                                label="Aadhaar Number" 
                                                value={aadhaar} 
                                                onChange={(e) => setAadhaar(e.target.value)}
                                                placeholder="1234 5678 9012"
                                            />
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleUpdateIdentity('AADHAAR', aadhaar)}
                                            disabled={updating}
                                        >
                                            Save
                                        </Button>
                                        <StatusBadge 
                                            status={profile.identityDocuments?.find(d => d.type === 'AADHAAR')?.isVerified ? 'APPROVED' : 'PENDING'} 
                                        />
                                    </div>
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
