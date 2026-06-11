import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from '@/lib/auth';
import {log} from '@/lib/logger';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params;
        const uploadDir = process.env.STORAGE_LOCAL_PATH || "/app/uploads";
        
        // Build the full file path
        const filePath = path.join(uploadDir, ...pathSegments);
        
        // DEBUG: Log the paths
        log.info('[UPLOAD_DEBUG] STORAGE_LOCAL_PATH:', process.env.STORAGE_LOCAL_PATH);
        log.info('[UPLOAD_DEBUG] uploadDir:', uploadDir);
        log.info('[UPLOAD_DEBUG] pathSegments:', pathSegments);
        log.info('[UPLOAD_DEBUG] full filePath:', filePath);
        
        // Check if this is a private file
        const isPrivate = pathSegments[0] === 'private';
        
        // For private files, require authentication
        if (isPrivate) {
            log.info('[UPLOAD_DEBUG] Private file, checking auth');
            const authResult = await authenticate(request);
            if (!authResult.success) {
                log.info('[UPLOAD_DEBUG] Auth failed');
                return new NextResponse("Unauthorized", { status: 401 });
            }
            log.info('[UPLOAD_DEBUG] Auth success');
        }
        
        // Check if file exists
        try {
            await fs.access(filePath);
            log.info('[UPLOAD_DEBUG] File exists!');
        } catch (error) {
            log.error('[UPLOAD_DEBUG] File NOT found at:', filePath);
            log.error('[UPLOAD_DEBUG] Error:', error);
            
            // Try to list the directory to see what's there
            const dir = path.dirname(filePath);
            try {
                const files = await fs.readdir(dir);
                log.info('[UPLOAD_DEBUG] Files in directory:', files);
            } catch (dirError) {
                log.error('[UPLOAD_DEBUG] Cannot read directory:', dir);
            }
            
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
            ? 'private, max-age=3600'
            : 'public, max-age=3153600, immutable';
        
        log.info('[UPLOAD_DEBUG] Serving file, size:', file.length);
        
        return new NextResponse(file, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': cacheControl,
            },
        });
    } catch (error) {
        log.error('[UPLOAD_DEBUG] Error:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}