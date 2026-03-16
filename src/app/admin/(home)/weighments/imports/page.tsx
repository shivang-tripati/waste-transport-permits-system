"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ImportTable } from "./_components/import-table";
import { FiltersBar } from "./_components/filters-bar";
import { UploadExcel } from "./_components/upload-excel";
import StatusChart from "./_components/status-chart";
import TrendChart from "./_components/trend-chart";

export default function ImportsDashboard() {
    const [filters, setFilters] = useState({});

    const { data: stats } = useQuery({
        queryKey: ["import-stats"],
        queryFn: () =>
            fetch("/api/admin/weighments/imports/stats")
                .then(r => r.json()),
        staleTime: 60000,
    });

    return (
        <div className="space-y-6">

            {/* Upload */}
            <UploadExcel />

            {/* Charts */}
            {stats && (
                <div className="grid grid-cols-2 gap-6">
                    <StatusChart data={stats.statusStats} />
                    <TrendChart data={stats.trend} />
                </div>
            )}

            {/* Filters */}
            <FiltersBar onChange={setFilters} />

            {/* Table */}
            <ImportTable filters={filters} />

        </div>
    );
}
