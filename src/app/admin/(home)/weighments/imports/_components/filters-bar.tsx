export function FiltersBar({ onChange }: { onChange: (filters: any) => void }) {
    return (
        <div className="flex gap-2">
            <input
                placeholder="Search slip / vehicle"
                onChange={e => onChange({ search: e.target.value })}
            />

            <select
                onChange={e => onChange({ status: e.target.value })}
            >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
            </select>
        </div>
    );
}
