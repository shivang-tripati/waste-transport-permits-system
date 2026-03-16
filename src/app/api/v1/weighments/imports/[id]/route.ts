


export async function PATCH(req: Request, { params }) {
    const body = await req.json();

    const updated =
        await prisma.legacyWeighmentImport.update({
            where: { id: params.id },
            data: body,
        });

    return Response.json(updated);
}
