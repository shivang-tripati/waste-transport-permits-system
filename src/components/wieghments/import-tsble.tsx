"use client";

import {
    useReactTable,
    getCoreRowModel,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';

export function ImportTable() {
    const { data } = useQuery({
        queryKey: ['imports'],
        queryFn: () =>
            fetch('/api/admin/imports').then(r => r.json()),
    });

    const table = useReactTable({
        data: data?.items ?? [],
        columns: [
            { accessorKey: 'weighmentNumber', header: 'Number' },
            { accessorKey: 'importStatus', header: 'Status' },
        ],
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <table>
            {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                            {cell.getValue() as string}
                        </td>
                    ))}
                </tr>
            ))}
        </table>
    );
}
