import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params;
        const uploadDir = process.env.STORAGE_LOCAL_PATH || "/app/uploads";
        
        // Build the full file path
        const filePath = path.join(uploadDir, ...pathSegments);
        
        // Check if this is a private file
        const isPrivate = pathSegments[0] === 'private';
        
        // For private files, require authentication
        if (isPrivate) {
            const authResult = await authenticate(request);
            if (!authResult.success) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
            
            // Optional: Check if user has permission to access this specific file
            // You could query the database to verify ownership
        }
        
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return new NextResponse("Not Found", { status: 404 });
        }
        
        // Read the file
        const file = await fs.readFile(filePath);
        
        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        const contentType = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
        }[ext] || 'application/octet-stream';
        
        // Set cache headers
        const cacheControl = isPrivate 
            ? 'private, max-age=3600'  // Private files: cache for 1 hour
            : 'public, max-age=3153600, immutable';  // Public files: cache for 1 year
        
        return new NextResponse(file, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': cacheControl,
            },
        });
    } catch (error) {
        console.error('Error serving file:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}