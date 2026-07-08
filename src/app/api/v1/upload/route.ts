
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getStorageProvider } from '@/lib/storage';
import { createErrorResponse, createSuccessResponse, CommonErrors } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const folderMap: Record<string, string> = {
    waste_evidence: 'public/evidence',
    weighment: 'public/weighments',

    aadhaar: 'private/aadhaar',
    pan: 'private/pan',
    identity: 'private/identity',

    company_document: 'private/company',

    misc: 'misc',
};



/**
 * @swagger
 * /api/v1/upload:
 *   post:
 *     summary: Upload a file
 *     description: >
 *       Uploads a file to cloud storage and returns its URL.
 *       Max size: 5MB. Allowed types: JPG, PNG, WEBP, PDF.
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 description: >
 *                   Determines the storage folder.
 *                   Values: waste_evidence, weighment, aadhaar, pan, identity, company_document, misc.
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Bad request (missing file, invalid type, too large)
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authenticate(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string | null;

        if (!file) {
            return createErrorResponse(CommonErrors.badRequest('No file provided'));
        }

        // Basic validation
        // Max size: 5MB
        if (file.size > 5 * 1024 * 1024) {
            return createErrorResponse(CommonErrors.badRequest('File size exceeds 5MB limit'));
        }

        // Allowed types
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return createErrorResponse(CommonErrors.badRequest('Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.'));
        }

        // Determine storage path
        // Structure: uploads/{type}/{year}/{month}/{uuid}.ext
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const ext = path.extname(file.name) || '.jpg';
        const folder = folderMap[type || 'misc'] || 'misc';
        const fileName = `${uuidv4()}${ext}`;
        const filePath = `${folder}/${year}/${month}/${fileName}`;

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload
        const storage = getStorageProvider();
        const url = await storage.upload(buffer, filePath, file.type);

        return createSuccessResponse({
            url,
            path: filePath,
            fileName: file.name,
            size: file.size,
            mimeType: file.type
        });

    } catch (error) {
        console.error('Upload error:', error);
        return createErrorResponse(error);
    }
}
