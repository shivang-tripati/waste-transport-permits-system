'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks';
import { Select } from '@/components/ui/select';;
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { registerSchema, RegisterInput } from '@/schemas';

// Extend the schema to include agreement
const registerWithAgreementSchema = registerSchema.extend({
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the Terms of Service and Privacy Policy',
  }),
});

type RegisterWithAgreementInput = RegisterInput & { agreeToTerms: boolean };

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterWithAgreementInput>({
    resolver: zodResolver(registerWithAgreementSchema),
    defaultValues: {
      role: 'INDIVIDUAL',
      agreeToTerms: false,
    },
  }); 
  
  const onSubmit = async (data: RegisterWithAgreementInput) => {
    setError(null);
    try {
      // Remove agreeToTerms before sending to API
      const { agreeToTerms, ...registerData } = data;
      await registerUser(registerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };
  
  return (
    <div className="min-h-screen bg-primary-light flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-2xl font-bold text-primary inline-block mb-2">
            Malba Free Gurugram
          </Link>
          <CardTitle className="text-xl">Create an account</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Get started with Transport Permit System</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}
            
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name')}
            />
            
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+91 9876543210"
              error={errors.phone?.message}
              {...register('phone')}
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              helperText="Min 8 chars with uppercase, lowercase, and number"
              {...register('password')}
            />

            <Select
              label="Register as"
              error={errors.role?.message}
              {...register('role')}
            >
              <option disabled value="">Select Role</option>
              <option value="INDIVIDUAL">INDIVIDUAL</option>
              <option value="COMPANY_USER">Company</option>
            </Select>
            
            {/* Terms and Conditions Checkbox */}
            <div className="space-y-2">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('agreeToTerms')}
                  className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms-of-service" target="_blank" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy-policy" target="_blank" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  {' '}and acknowledge the{' '}
                  <Link href="/compliance" target="_blank" className="text-primary hover:underline">
                    Compliance Requirements
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>
          
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}