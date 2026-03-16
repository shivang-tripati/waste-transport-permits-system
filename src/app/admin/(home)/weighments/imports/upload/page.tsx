"use client";

import { post } from '@/lib/api/client';
import { useMutation } from '@tanstack/react-query';

export default function UploadPage() {
    const mutation = useMutation({
        mutationFn: async (file: File) => {
            const form = new FormData();
            form.append('file', file);

            const res = await post('/api/v1/weighments/imports')
            return res.data;
        },
    });

    return (
        <input
            type="file"
            onChange={e => {
                if (e.target.files)
                    mutation.mutate(e.target.files[0]);
            }}
        />
    );
}
