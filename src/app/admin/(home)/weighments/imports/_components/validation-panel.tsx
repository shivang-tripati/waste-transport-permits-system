

export function ValidationPanel({ row }: { row: any }) {
    if (!row.errors) return null;

    return (
        <div className="bg-red-50 p-2">
            {row.errors.map((e: string, i: number) => (
                <p key={i}>{e}</p>
            ))}
        </div>
    );
}
