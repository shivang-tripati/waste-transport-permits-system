'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPlantSchema, updatePlantSchema, type CreatePlantInput } from '@/schemas';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { post, patch } from '@/lib/api/client';

interface PlantFormProps {
  initialData?: any; // strict type would be Plant from prisma but 'any' is flexible for now
  isEdit?: boolean;
}

export function PlantForm({ initialData, isEdit = false }: PlantFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePlantInput>({
    resolver: zodResolver(isEdit ? updatePlantSchema : createPlantSchema) as any,
    defaultValues: initialData || {
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      contactEmail: '',
      contactPhone: '',
      operatingHours: '',
      capacity: undefined,
    },
  });

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);

    try {
      if (isEdit) {
        await patch(`/plants/${initialData.id}`, data);
      } else {
        await post('/plants', data);
      }
      router.push('/admin/plants');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save plant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Plant Name *"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Plant Code *"
              {...register('code')}
              error={errors.code?.message}
              disabled={isEdit} // Code is unique and usually immutable if used as ID
            />
          </div>

          <Input
            label="Address *"
            {...register('address')}
            error={errors.address?.message}
          />

          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="City *"
              {...register('city')}
              error={errors.city?.message}
            />
            <Input
              label="State *"
              {...register('state')}
              error={errors.state?.message}
            />
            <Input
              label="Pincode *"
              {...register('pincode')}
              error={errors.pincode?.message}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Contact Email"
              type="email"
              {...register('contactEmail')}
              error={errors.contactEmail?.message}
            />
            <Input
              label="Contact Phone"
              {...register('contactPhone')}
              error={errors.contactPhone?.message}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Operating Hours"
              {...register('operatingHours')}
              error={errors.operatingHours?.message}
              placeholder="e.g. 9 AM - 6 PM"
            />
            <Input
              label="Daily Capacity (Tons)"
              type="number"
              {...register('capacity', { valueAsNumber: true })}
              error={errors.capacity?.message}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              {isEdit ? 'Update Plant' : 'Create Plant'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
