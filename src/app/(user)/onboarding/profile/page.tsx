'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createIdentityDocumentSchema } from '@/schemas';
import { post } from '@/lib/api/client';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, FileUpload } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';

export default function IndividualOnboardingPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch profile to see what's already uploaded
    const { data: profileResponse, refetch } = useQuery({
        queryKey: ['profile'],
        queryFn: () => fetch('/api/v1/profile').then(res => res.json()),
        enabled: !!user
    });

    const profile = profileResponse?.success ? profileResponse.data : null;
    const identityDocs = profile?.identityDocuments || [];

    const hasAadhaar = identityDocs.some((doc: any) => doc.type === 'AADHAAR');
    const hasPan = identityDocs.some((doc: any) => doc.type === 'PAN');

    // Protection
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user?.role !== 'INDIVIDUAL') {
                router.push('/dashboard');
            } else if (hasAadhaar && hasPan) {
                router.push('/dashboard');
            }
        }
    }, [isLoading, isAuthenticated, user, router, hasAadhaar, hasPan]);

    if (isLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const handleComplete = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
                    <p className="mt-2 text-gray-600">Please upload your identity documents to start creating permits.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Aadhaar Card */}
                    <IdentityDocumentForm
                        type="AADHAAR"
                        label="Aadhaar Card"
                        existingDoc={identityDocs.find((doc: any) => doc.type === 'AADHAAR')}
                        onSuccess={refetch}
                    />

                    {/* PAN Card */}
                    <IdentityDocumentForm
                        type="PAN"
                        label="PAN Card"
                        existingDoc={identityDocs.find((doc: any) => doc.type === 'PAN')}
                        onSuccess={refetch}
                    />
                </div>

                <div className="flex justify-center">
                    <Button
                        onClick={handleComplete}
                        disabled={!hasAadhaar || !hasPan}
                        className="px-8"
                    >
                        {hasAadhaar && hasPan ? 'Complete Onboarding' : 'Upload Both Documents to Continue'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function IdentityDocumentForm({ type, label, existingDoc, onSuccess }: {
    type: 'AADHAAR' | 'PAN',
    label: string,
    existingDoc?: any,
    onSuccess: () => void
}) {
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(createIdentityDocumentSchema),
        defaultValues: {
            type: type,
            documentNumber: existingDoc?.documentNumber || '',
            filePath: existingDoc?.filePath || '',
        }
    });

    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const filePath = watch('filePath');

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await post<any>('/profile/identity', data);
            if (res.success) {
                onSuccess();
            } else {
                setSubmitError(res.error?.message || `Failed to update ${label}`);
            }
        } catch (err: any) {
            setSubmitError(err.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className={existingDoc ? 'border-green-200 bg-green-50/30' : ''}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    {label}
                    {existingDoc && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-normal">
                            {existingDoc.isVerified ? 'Verified' : 'Uploaded'}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label={`${label} Number`}
                        {...register('documentNumber')}
                        error={errors.documentNumber?.message as string}
                        placeholder={type === 'AADHAAR' ? '1234 5678 9012' : 'ABCDE1234F'}
                    />

                    {!filePath ? (
                        <FileUpload
                            label={`Upload ${label} Copy`}
                            uploadType="identity"
                            accept="image/*,application/pdf"
                            onUploadComplete={(data) => {
                                setValue('filePath', data.path);
                            }}
                            helperText="Upload a clear image or PDF of your card"
                        />
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Document Uploaded</label>
                            <div className="p-3 bg-white border rounded-lg flex items-center justify-between">
                                <span className="text-xs text-gray-500 truncate max-w-[150px]">{filePath}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 h-8 px-2"
                                    onClick={() => setValue('filePath', '')}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    )}

                    {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

                    <Button
                        type="submit"
                        disabled={isSubmitting || !filePath}
                        className="w-full"
                        variant={existingDoc ? 'outline' : 'primary'}
                    >
                        {isSubmitting ? 'Saving...' : existingDoc ? 'Update Document' : `Save ${label}`}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
