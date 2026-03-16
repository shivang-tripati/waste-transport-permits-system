import ExcelJS from "exceljs";
import { validateRow } from "./validationEngine";

/*
EXPECTED EXCEL FORMAT (STRICT)

1  Slip No
2  Vehicle No
3  Material
4  First Weight
5  Second Weight
6  Net Weight (ignored, recalculated)
7  First Date (DD/MM/YY)
8  First Time (HH:mm:ss)
9  Second Date (DD/MM/YY)
10 Second Time (HH:mm:ss)
11 Supplier
12 Location
13 Customer
*/

//
// --------------------------------------------------
// Weight parser
// --------------------------------------------------
//

function parseWeight(value: any): number | null {
    if (value === null || value === undefined || value === "")
        return null;

    const n = Number(
        String(value).replace(/,/g, "").trim()
    );

    return isNaN(n) ? null : n;
}

//
// --------------------------------------------------
// Date parser (DD/MM/YY + time)
// --------------------------------------------------
//

function parseDateTime(date: any, time: any): Date | null {
    if (!date) return null;

    try {
        const parts = String(date).split("/");

        if (parts.length !== 3) return null;

        const [day, month, year] = parts;

        const fullYear = year.length === 2
            ? "20" + year
            : year;

        const timeStr =
            time && String(time).trim()
                ? String(time).trim()
                : "00:00:00";

        const iso =
            `${fullYear}-${month}-${day}T${timeStr}`;

        const d = new Date(iso);

        return isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
}

//
// --------------------------------------------------
// Excel cell normalizer
// (handles formula objects etc.)
// --------------------------------------------------
//

function normalizeCell(value: any) {
    if (
        value &&
        typeof value === "object" &&
        "result" in value
    ) {
        return value.result;
    }

    return value;
}

//
// --------------------------------------------------
// JSON sanitizer (CRITICAL FOR PRISMA)
// Removes ALL undefined recursively
// --------------------------------------------------
//

function sanitizeJson(value: any): any {
    if (value === undefined) return null;

    value = normalizeCell(value);

    if (Array.isArray(value)) {
        // convert sparse array → dense
        return Array.from(value, v =>
            v === undefined ? null : sanitizeJson(v)
        );
    }

    if (value && typeof value === "object") {
        if (Object.keys(value).length === 0)
            return null;

        const obj: any = {};

        for (const key in value) {
            const v = value[key];
            obj[key] =
                v === undefined
                    ? null
                    : sanitizeJson(v);
        }

        return obj;
    }

    return value;
}


//
// --------------------------------------------------
// Extract row values safely
// ExcelJS rows are 1-indexed
// --------------------------------------------------
//

function getRowValues(row: ExcelJS.Row): any[] {
    const values = row.values;

    if (!values) return [];

    const arr = Array.isArray(values)
        ? values.slice(1)
        : Object.values(values);

    // force dense + sanitize
    return Array.from(arr, v =>
        v === undefined ? null : sanitizeJson(v)
    );
}


//
// --------------------------------------------------
// MAIN PARSER
// --------------------------------------------------
//

export async function parseExcel(
    arrayBuffer: ArrayBuffer
) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheet = workbook.worksheets[0];

    const validRows: any[] = [];
    const failedRows: any[] = [];

    sheet.eachRow((row, i) => {
        if (i === 1) return; // skip header

        const raw = getRowValues(row);

        const firstWeight = parseWeight(raw[3]);
        const secondWeight = parseWeight(raw[4]);

        const netWeight =
            firstWeight !== null &&
                secondWeight !== null
                ? Math.abs(
                    secondWeight - firstWeight
                )
                : null;

        const data = {
            slipNo: String(raw[0] || "").trim(),
            vehicleNo: String(raw[1] || "").trim(),
            material: String(raw[2] || "").trim(),

            firstWeight,
            secondWeight,
            netWeight,

            firstWeighAt: parseDateTime(
                raw[6],
                raw[7]
            ),

            secondWeighAt: parseDateTime(
                raw[8],
                raw[9]
            ),

            supplier: String(raw[10] || "").trim(),
            location: String(raw[11] || "").trim(),
            customer: String(raw[12] || "").trim(),

            rawData: raw,
        };

        const errors = validateRow(data);

        if (errors.length) {
            failedRows.push({
                ...data,
                importStatus: "FAILED",
                errors,
            });
        } else {
            validRows.push({
                ...data,
                importStatus: "PENDING",
            });
        }
    });

    return { validRows, failedRows };
}
