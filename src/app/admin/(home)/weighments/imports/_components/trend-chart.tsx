"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";

export default function TrendChart({ data }: { data: any[] }) {
    return (
        <LineChart width={500} height={300} data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" />
        </LineChart>
    );
}
