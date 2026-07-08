import { parseExcel } from "@/lib/imports/excelParser";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * @swagger
 * /api/v1/weighments/imports:
 *   post:
 *     summary: Import legacy weighments
 *     description: Uploads an Excel file to bulk import legacy weighment records.
 *     tags:
 *       - Legacy Imports
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import results
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */
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



/**
 * @swagger
 * /api/v1/weighments/imports:
 *   get:
 *     summary: List legacy weighment imports
 *     description: Returns paginated list of legacy weighment imports.
 *     tags:
 *       - Legacy Imports
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by slip number or vehicle number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, MAPPED, FAILED]
 *     responses:
 *       200:
 *         description: Paginated list of imports
 *       401:
 *         description: Unauthorized
 */
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