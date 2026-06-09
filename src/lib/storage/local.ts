
import fs from 'fs/promises';
import path from 'path';
import { StorageProvider } from './types';

export class LocalStorageProvider implements StorageProvider {
    private uploadDir: string;
    private baseUrl: string;

    constructor() {
        this.uploadDir =
            process.env.STORAGE_LOCAL_PATH ||
            path.join(process.cwd(), 'uploads');

        this.baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            'http://localhost:3000';
    }

    async upload(file: Buffer, filePath: string, mimeType: string): Promise<string> {
        const fullPath = path.join(this.uploadDir, filePath);
        const dir = path.dirname(fullPath);

        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });

        // Write file
        await fs.writeFile(fullPath, file);

        return this.getUrl(filePath);
    }

    async delete(filePath: string): Promise<void> {
        const fullPath = path.join(this.uploadDir, filePath);
        try {
            await fs.unlink(fullPath);
        } catch (error) {
            // Ignore if file doesn't exist
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
        }
    }

    getUrl(filePath: string): string {
    // Clean the path
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    // If it's a private file, route through API for authentication
    if (cleanPath.startsWith('private/')) {
        return `/api/uploads/${cleanPath}`;
    }
    
    // Public files can be served directly by nginx
    if (cleanPath.startsWith('public/')) {
        return `/uploads/${cleanPath}`;
    }
    
    // Default fallback
    return `/uploads/${cleanPath}`;
}
}
