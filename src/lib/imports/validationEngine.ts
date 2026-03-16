export function validateRow(row: any) {
    const errors: string[] = [];

    if (!row.slipNo) {
        errors.push("Missing slip number");
    }

    if (!row.vehicleNo) {
        errors.push("Missing vehicle number");
    }

    if (
        row.firstWeight === null ||
        row.secondWeight === null
    ) {
        errors.push("Invalid weight");
    }

    if (
        row.firstWeight !== null &&
        row.secondWeight !== null &&
        row.netWeight !== null
    ) {
        const expected =
            Math.abs(
                row.secondWeight -
                row.firstWeight
            );

        if (Math.abs(expected - row.netWeight) > 5) {
            errors.push("Net weight mismatch");
        }
    }

    return errors;
}
