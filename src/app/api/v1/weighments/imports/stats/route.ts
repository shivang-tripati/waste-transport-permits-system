import { prisma } from "@/lib/db";

/**
 * @swagger
 * /api/v1/weighments/imports/stats:
 *   get:
 *     summary: Get import statistics
 *     description: Returns analytics for legacy weighment imports (status distribution, daily trend, weight stats).
 *     tags:
 *       - Legacy Imports
 *     responses:
 *       200:
 *         description: Import statistics
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
    // Status distribution
    const statusStats =
        await prisma.legacyWeighmentImport.groupBy({
            by: ["importStatus"],
            _count: true,
        });

    // Daily trend
    const trend = await prisma.$queryRaw`
    SELECT DATE("createdAt") as date,
           COUNT(*) as count
    FROM "LegacyWeighmentImport"
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

    // Weight analytics
    const weightStats =
        await prisma.legacyWeighmentImport.aggregate({
            _avg: { netWeight: true },
            _max: { netWeight: true },
            _min: { netWeight: true },
        });

    return Response.json({
        statusStats,
        trend,
        weightStats,
    });
}
