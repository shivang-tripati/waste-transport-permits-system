"use client"
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api/client';
import { Button, StatusBadge, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks';

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { user} = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', page],
    queryFn: () => get<any>(`/projects?page=${page}&limit=10`),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading projects...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load projects</div>;
  }

  const projects = data?.data || [];
  const meta = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects Management</h1>
          <p className="text-muted-foreground">Monitor and manage waste collection projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close' : 'Add Project'}
          </Button>
        </div>
      </div>

      {showForm && user?.companyId && (
  <ProjectForm
    companyId={user.companyId}
    onSuccess={() => {
      setShowForm(false);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }}
  />
)}

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Company</th>
                  <th className="px-6 py-3 font-medium">Location</th>
                  <th className="px-6 py-3 font-medium text-center">Permits</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  projects.map((project: any) => (
                    <tr key={project.id} className="hover:bg-gray-50 bg-white">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{project.name}</div>
                        {project.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{project.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/companies/${project.company?.id}`} className="text-blue-600 hover:underline">
                          {project.company?.name || 'N/A'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div>{project.city}, {project.state}</div>
                        <div className="text-xs text-gray-400">{project.pincode}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {project._count?.permits || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={project.isActive ? 'ACTIVE' : 'INACTIVE'}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/projects/${project.id}`}>
                          <Button variant="ghost" size="sm">
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
               <div className="text-sm text-gray-500">
                 Page {meta.page} of {meta.totalPages}
               </div>
               <div className="flex gap-2">
                 <Button 
                   variant="secondary" 
                   size="sm" 
                   disabled={meta.page === 1}
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                 >
                   Previous
                 </Button>
                 <Button 
                   variant="secondary" 
                   size="sm" 
                   disabled={meta.page === meta.totalPages}
                   onClick={() => setPage(p => p + 1)}
                 >
                   Next
                 </Button>
               </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectForm({ onSuccess, companyId }: { onSuccess: () => void, companyId: string }) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitError(null);
    console.log('Submitting project:', data);
    try {
      const payload = {
        ...data,
        companyId
      }
      const res = await post<any>('/projects', data);
      console.log("Response", res);
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
        alert('Location fetched!');
      }, (error) => {
        alert('Error fetching location: ' + error.message);
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Project</CardTitle>
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
            {isSubmitting ? 'Creating Project...' : 'Create Project'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
