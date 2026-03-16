import { ChevronLeft, ChevronRight } from "lucide-react";



export function Pagination({
    page,
    limit,
    total,
    onPageChange,
    onLimitChange,
}: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm">
                    Page {page} of {Math.ceil(total / limit)}
                </span>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === Math.ceil(total / limit)}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
            <div className="flex items-center gap-2">
                <select
                    value={limit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>
        </div>
    );
}