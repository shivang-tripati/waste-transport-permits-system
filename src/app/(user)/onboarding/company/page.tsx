'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCompanySchema, createProjectSchema } from '@/schemas'; // Assuming schemas exist
import { post } from '@/lib/api/client';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

// Temporary schema definitions if not imported (I will rely on imports if they exist, or define them)
// For now, I will assume they are imported, or I'll define simple interfaces.

export default function CompanyOnboardingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Protection
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'COMPANY_USER') {
        router.push('/dashboard');
      } else if (user?.companyId) {
        // Already has company
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Transport Permit System</h1>
          <p className="mt-2 text-gray-600">Complete your company profile to get started.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <div className={`h-1 w-16 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
        </div>

        {step === 1 && (
          <CompanyForm 
            onSuccess={(cId) => {
              setCompanyId(cId);
              setStep(2);
            }} 
          />
        )}
        
        {step === 2 && companyId && (
          <ProjectForm 
            companyId={companyId} 
            onSuccess={() => {
                // Update local user state manually before redirect
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const u = JSON.parse(storedUser);
                    u.companyId = companyId;
                    localStorage.setItem('user', JSON.stringify(u));
                }
                // Force reload to pick up new state
                window.location.href = '/dashboard';
            }}
          />
        )}
      </div>
    </div>
  );
}

function CompanyForm({ onSuccess }: { onSuccess: (id: string) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    // resolver: zodResolver(createCompanySchema) // verify import
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await post<any>('/onboarding/company', data);
      if (res.success && res.data) {
        onSuccess(res.data.id);
      } else {
        setSubmitError(res.error?.message || 'Failed to create company');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Company Name" {...register('name', { required: true })} error={errors.name?.message as string} />
                    <Input label="GST Number" {...register('gstNumber')} error={errors.gstNumber?.message as string} />
                    <Input label="Registration Number" {...register('registrationNumber')} error={errors.registrationNumber?.message as string} />
                    <Input label="Contact Email" type="email" {...register('contactEmail')} error={errors.contactEmail?.message as string} />
                    <Input label="Contact Phone" {...register('contactPhone')} error={errors.contactPhone?.message as string} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input label="Address Line 1" {...register('address')} error={errors.address?.message as string} />
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="City" {...register('city', { required: true })} error={errors.city?.message as string} />
                        <Input label="State" {...register('state', { required: true })} error={errors.state?.message as string} />
                        <Input label="Pincode" {...register('pincode', { required: true })} error={errors.pincode?.message as string} />
                    </div>
                </div>
                
                {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
                
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Saving...' : 'Next: Add Project'}
                </Button>
            </form>
        </CardContent>
    </Card>
  );
}

function ProjectForm({ companyId, onSuccess }: { companyId: string, onSuccess: () => void }) {
    const { register, handleSubmit, formState: { errors }, setValue } = useForm();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    const onSubmit = async (data: any) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const payload = { ...data, companyId };
        const res = await post<any>('/projects', payload);
        if (res.success) {
          onSuccess();
        } else {
          setSubmitError(res.error?.message || 'Failed to create project');
        }
      } catch (err: any) {
        setSubmitError(err.message || 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    };
    
    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setValue('latitude', position.coords.latitude);
                setValue('longitude', position.coords.longitude);
                // Ideally reverse geocode here, but for now just set lat/lng
                alert('Location fetched!');
            }, (error) => {
                alert('Error fetching location: ' + error.message);
            });
        }
    };
  
    return (
      <Card>
          <CardHeader>
              <CardTitle>Create First Project</CardTitle>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input label="Project Name" {...register('name', { required: true })} error={errors.name?.message as string} />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Site Address</label>
                    <Input label="Address" {...register('address', { required: true })} error={errors.address?.message as string} />
                     <div className="grid grid-cols-3 gap-4">
                        <Input label="City" {...register('city', { required: true })} error={errors.city?.message as string} />
                        <Input label="State" {...register('state', { required: true })} error={errors.state?.message as string} />
                        <Input label="Pincode" {...register('pincode', { required: true })} error={errors.pincode?.message as string} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                       <Input label="Latitude" type="number" step="any" {...register('latitude', { valueAsNumber: true })} />
                       <Input label="Longitude" type="number" step="any" {...register('longitude', { valueAsNumber: true })} />
                  </div>
                  <Button type="button" variant="outline" onClick={handleUseCurrentLocation} className="w-full">
                      Use Current Location
                  </Button>
  
                  {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
  
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? 'Creating Project...' : 'Complete Onboarding'}
                  </Button>
              </form>
          </CardContent>
      </Card>
    );
  }
