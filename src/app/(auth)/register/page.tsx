'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { registerSchema, RegisterInput } from '@/schemas';
import { Select } from '@/components/ui/select';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'INDIVIDUAL',
    },
  }); 
  
  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    try {
      await registerUser(data);
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
          <form onSubmit={handleSubmit(onSubmit)} 
          className="space-y-4">
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
