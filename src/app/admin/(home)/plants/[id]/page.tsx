'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get, del } from '@/lib/api/client';
import { PlantForm } from '../_components/plant-form';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function EditPlantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ['plant', id],
    queryFn: () => get<any>(`/plants/${id}`),
    retry: false,
  });

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to deactivate this plant?')) return;
    
    setIsDeleting(true);
    try {
      await del(`/plants/${id}`);
      router.push('/admin/plants');
      router.refresh();
    } catch (error) {
      alert('Failed to delete plant');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading plant details...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">Plant not found or error loading details</div>
        <Button onClick={() => router.push('/admin/plants')}>Back to List</Button>
      </div>
    );
  }

  const plant = data?.data;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Plant</h1>
          <p className="text-muted-foreground">Update plant details</p>
        </div>
        
        <Button 
          variant="danger" 
          onClick={handleDelete}
          isLoading={isDeleting}
        >
          Deactivate Plant
        </Button>
      </div>

      <PlantForm initialData={plant} isEdit={true} />
    </div>
  );
}
