"use client";

import {
    PieChart,
    Pie,
    Tooltip,
    Legend,
} from "recharts";

export default function StatusChart({ data }: { data: any[] }) {
    const chartData = data.map(d => ({
        name: d.importStatus,
        value: d._count,
    }));

    return (
        <PieChart width={400} height={300}>
            <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
            />
            <Tooltip />
            <Legend />
        </PieChart>
    );
}
