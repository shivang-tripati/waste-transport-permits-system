import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createSuccessResponse, createErrorResponse, CommonErrors } from "@/lib/api";

/**
 * @swagger
 * /api/v1/weighments/imports/{id}:
 *   patch:
 *     summary: Update legacy import record
 *     description: Updates fields of a legacy weighment import (e.g., mapping a permit).
 *     tags:
 *       - Legacy Imports
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: The fields to update (e.g., permitId, importStatus)
 *     responses:
 *       200:
 *         description: Record updated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function PATCH(request: NextRequest, context: any): Promise<Response> {
    try {
        const body = await request.json();
        const { id } = context.params; // Next.js provides params directly

        const updated = await prisma.legacyWeighmentImport.update({
            where: { id },
            data: body,
        });

        return createSuccessResponse(updated);
    } catch (err) {
        return createErrorResponse(CommonErrors.internalError((err as Error).message));
    }
}
