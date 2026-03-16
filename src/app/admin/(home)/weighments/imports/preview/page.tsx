"use client";

import { get } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';

export default function BatchDetail({ params }: { params: { batchId: string } }) {
    const { data } = useQuery({
        queryKey: ['batch', params.batchId],
        queryFn: async () =>
            await get('/api/v1/weighments/imports?batchId=${params.batchId}')
    });

    return (
        <pre>{JSON.stringify(data, null, 2)}</pre>
    );
}
