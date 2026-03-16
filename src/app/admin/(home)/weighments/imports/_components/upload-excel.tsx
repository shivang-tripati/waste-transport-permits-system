"use client";

import { useState } from "react";

export function UploadExcel() {
    const [preview, setPreview] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handle(file: File | null) {
        if (!file) return;

        if (!file.name.endsWith(".xlsx")) {
            setError("Please upload an Excel (.xlsx) file");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const form = new FormData();
            form.append("file", file);

            const res = await fetch("/api/v1/weighments/imports", {
                method: "POST",
                body: form,
            });

            const data = await res.json();

            setPreview(data.preview ?? []);
        } catch {
            setError("Upload failed");
        }

        setLoading(false);
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow border space-y-4">

            <div>
                <h2 className="text-lg font-semibold">
                    Upload Weighment Excel
                </h2>
                <p className="text-sm text-gray-500">
                    Required columns: Slip No, Vehicle No,
                    First Weight, Second Weight
                </p>
            </div>

            <input
                type="file"
                accept=".xlsx"
                onChange={(e) =>
                    handle(e.target.files?.[0] || null)
                }
            />

            {loading && <p>Parsing Excel…</p>}
            {error && (
                <p className="text-red-600">{error}</p>
            )}

            {preview.length > 0 && (
                <p className="text-green-600">
                    Preview loaded: {preview.length} rows
                </p>
            )}

        </div>
    );
}
