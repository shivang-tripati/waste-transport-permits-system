"use client";

import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
} from "@tanstack/react-table";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";

type ImportRow = {
    id: string;
    slipNo: string;
    vehicleNo: string;
    material: string;
    firstWeight: number | null;
    secondWeight: number | null;
    netWeight: number | null;
    supplier: string;
    customer: string;
    importStatus: string;
};
type ApiResponse = {
    items: ImportRow[];
    total: number;
    page: number;
    limit: number;
    pages: number;
};

export function ImportTable({ filters }: { filters: any }) {

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const { data, isLoading } = useQuery<ApiResponse>({
        queryKey: ["imports", filters, page],
        queryFn: () =>
            fetch(
                `/api/v1/weighments/imports?page=${page}&${new URLSearchParams(filters).toString()}`
            ).then((r) => r.json()),
    });


    // ✅ ALWAYS fallback to empty array
    const rows = data?.items ?? [];

    console.log(rows);

    const columns: ColumnDef<ImportRow>[] = [
        {
            accessorKey: "slipNo",
            header: "Slip No",
        },
        {
            accessorKey: "vehicleNo",
            header: "Vehicle",
        },
        {
            accessorKey: "material",
            header: "Material",
        },
        {
            accessorKey: "firstWeight",
            header: "First Wt",
        },
        {
            accessorKey: "secondWeight",
            header: "Second Wt",
        },
        {
            accessorKey: "netWeight",
            header: "Net Wt",
            cell: (info) => (
                info.getValue()
            ),
        },
        {
            accessorKey: "supplier",
            header: "Supplier",
        },
        {
            accessorKey: "customer",
            header: "Customer",
        },
        {
            accessorKey: "importStatus",
            header: "Status",
            cell: (info) => {
                const status = info.getValue() as string;

                const color =
                    status === "FAILED"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700";

                return (
                    <span className={`px-2 py-1 rounded text-xs ${color}`}>
                        {status}
                    </span>
                );
            },
        },
    ];


    const table = useReactTable({
        data: rows,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="bg-white border rounded-xl overflow-hidden">

            <table className="w-full text-sm">

                <thead className="bg-gray-50">
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id}>
                            {hg.headers.map((header) => (
                                <th key={header.id} className="p-3 text-left">
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>

                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={3} className="p-6 text-center">
                                Loading imports...
                            </td>
                        </tr>
                    ) : rows.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="p-6 text-center">
                                No imports found
                            </td>
                        </tr>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="border-t">
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="p-3">
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>

            </table>

            <div className="flex justify-end p-3">
                <Pagination
                    page={page}
                    limit={limit}
                    total={data?.total || 0}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            </div>

        </div>
    );
}
