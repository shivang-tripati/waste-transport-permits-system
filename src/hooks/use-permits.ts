'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '@/lib/api/client';
import {
    CreatePermitInput,
    UpdatePermitInput,
    SubmitPermitInput,
    ApprovePermitInput,
    RejectPermitInput,
} from '@/schemas';
import { Permit, PermitStatus, WasteType } from '@prisma/client';

// Types
interface PermitListParams {
    page?: number;
    limit?: number;
    status?: PermitStatus;
    wasteType?: WasteType;
    projectId?: string;
    plantId?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

interface PermitWithRelations extends Permit {
    project: { id: string; name: string; address?: string; city?: string };
    plant: { id: string; name: string; code: string; city?: string };
    user: { id: string; name: string; email: string };
}

// Query keys
export const permitKeys = {
    all: ['permits'] as const,
    lists: () => [...permitKeys.all, 'list'] as const,
    list: (params: PermitListParams) => [...permitKeys.lists(), params] as const,
    details: () => [...permitKeys.all, 'detail'] as const,
    detail: (id: string) => [...permitKeys.details(), id] as const,
};

// Hooks

export function usePermits(params: PermitListParams = {}) {
    return useQuery({
        queryKey: permitKeys.list(params),
        queryFn: async () => {
            const response = await get<PermitWithRelations[]>('/permits', params as Record<string, string | number | boolean>);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to fetch permits');
            }
            return { data: response.data!, pagination: response.pagination };
        },
    });
}

export function usePermit(id: string) {
    return useQuery({
        queryKey: permitKeys.detail(id),
        queryFn: async () => {
            const response = await get<PermitWithRelations>(`/permits/${id}`);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to fetch permit');
            }
            return response.data!;
        },
        enabled: !!id,
    });
}

export function useCreatePermit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePermitInput) => {
            const response = await post<PermitWithRelations>('/permits', data);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to create permit');
            }
            return response.data!;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: permitKeys.lists() });
        },
    });
}

export function useUpdatePermit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdatePermitInput }) => {
            const response = await patch<PermitWithRelations>(`/permits/${id}`, data);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to update permit');
            }
            return response.data!;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: permitKeys.lists() });
            queryClient.setQueryData(permitKeys.detail(data.id), data);
        },
    });
}

export function useSubmitPermit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: SubmitPermitInput }) => {
            const response = await post<PermitWithRelations>(`/permits/${id}/submit`, data);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to submit permit');
            }
            return response.data!;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: permitKeys.lists() });
            queryClient.setQueryData(permitKeys.detail(data.id), data);
        },
    });
}

export function useApprovePermit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: ApprovePermitInput }) => {
            const response = await post<PermitWithRelations>(`/permits/${id}/approve`, data);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to approve permit');
            }
            return response.data!;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: permitKeys.lists() });
            queryClient.setQueryData(permitKeys.detail(data.id), data);
        },
    });
}

export function useRejectPermit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: RejectPermitInput }) => {
            const response = await post<PermitWithRelations>(`/permits/${id}/reject`, data);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to reject permit');
            }
            return response.data!;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: permitKeys.lists() });
            queryClient.setQueryData(permitKeys.detail(data.id), data);
        },
    });
}

export function useDeletePermit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await del(`/permits/${id}`);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to delete permit');
            }
            return id;
        },
        onSuccess: (id) => {
            queryClient.invalidateQueries({ queryKey: permitKeys.lists() });
            queryClient.removeQueries({ queryKey: permitKeys.detail(id) });
        },
    });
}
