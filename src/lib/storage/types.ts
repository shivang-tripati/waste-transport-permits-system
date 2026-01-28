
export interface StorageProvider {
    /**
     * Upload a file to storage
     * @param file The file buffer or stream
     * @param path The path where the file should be stored (e.g., 'permits/123/evidence.jpg')
     * @returns The public URL of the uploaded file
     */
    upload(file: Buffer, path: string, mimeType: string): Promise<string>;

    /**
     * Delete a file from storage
     * @param path The path of the file to delete
     */
    delete(path: string): Promise<void>;

    /**
     * Get the public URL for a file
     * @param path The path of the file
     */
    getUrl(path: string): string;
}
