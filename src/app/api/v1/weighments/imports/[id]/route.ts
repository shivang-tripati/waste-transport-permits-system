import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createSuccessResponse, createErrorResponse, CommonErrors } from "@/lib/api";

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
