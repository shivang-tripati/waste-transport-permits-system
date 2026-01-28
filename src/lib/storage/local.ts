
import fs from 'fs/promises';
import path from 'path';
import { StorageProvider } from './types';

export class LocalStorageProvider implements StorageProvider {
    private uploadDir: string;
    private baseUrl: string;

    constructor() {
        // In Next.js, 'public' folder is served statically
        this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
        this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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
        // Basic implementation: assumes files are in public/uploads and served at /uploads
        // Ensure we don't have double slashes
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        return `/uploads/${cleanPath}`;
    }
}
