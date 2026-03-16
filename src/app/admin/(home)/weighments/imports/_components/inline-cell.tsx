import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export function InlineCell({ row, field }: { row: any; field: string }) {
    const [value, setValue] = useState(row[field]);

    const mutation = useMutation({
        mutationFn: () =>
            fetch(`/api/admin/imports/${row.id}`, {
                method: "PATCH",
                body: JSON.stringify({ [field]: value }),
            }),
    });

    return (
        <td>
            <input
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={() => mutation.mutate()}
            />
        </td>
    );
}
