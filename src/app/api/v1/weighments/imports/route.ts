import { parseExcel } from "@/lib/imports/excelParser";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return Response.json(
            { error: "No file uploaded" },
            { status: 400 }
        );
    }

    const { validRows, failedRows } =
        await parseExcel(await file.arrayBuffer());

    const CHUNK = 500;

    for (let i = 0; i < validRows.length; i += CHUNK) {
        await prisma.legacyWeighmentImport.createMany({
            data: validRows.slice(i, i + CHUNK),
        });
    }

    return Response.json({
        success: true,
        imported: validRows.length,
        failed: failedRows.length,
        errors: failedRows.slice(0, 10),
    });
}



export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    // ✅ safe pagination parsing
    const page = Math.max(
        1,
        Number(searchParams.get("page")) || 1
    );

    const limit = Math.min(
        100, // max limit protection
        Math.max(
            1,
            Number(searchParams.get("limit")) || 20
        )
    );

    const search = searchParams
        .get("search")
        ?.trim();

    const status = searchParams.get("status");

    // ✅ typed Prisma filter
    const where: Prisma.LegacyWeighmentImportWhereInput =
        {};

    if (search) {
        where.OR = [
            {
                slipNo: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            {
                vehicleNo: {
                    contains: search,
                    mode: "insensitive",
                },
            },
        ];
    }

    if (status) {
        where.importStatus = status;
    }

    const [rows, total] = await Promise.all([
        prisma.legacyWeighmentImport.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.legacyWeighmentImport.count({
            where,
        }),
    ]);

    return Response.json({
        items: rows,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
    });
}