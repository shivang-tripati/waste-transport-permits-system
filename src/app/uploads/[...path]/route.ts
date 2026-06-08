import fs from "fs/promises";
import path from "path";

export async function GET(
    request: Request,
    { params }: { params: { path: string[] } }
) {
    const uploadDir =
        process.env.STORAGE_LOCAL_PATH || "/app/uploads";

    const filePath = path.join(
        uploadDir,
        ...params.path
    );

    try {
        const file = await fs.readFile(filePath);

        return new Response(file);
    } catch {
        return new Response("Not Found", {
            status: 404,
        });
    }
}