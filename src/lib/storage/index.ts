
import { LocalStorageProvider } from './local';
import { StorageProvider } from './types';

// Factory to get the configured storage provider
export function getStorageProvider(): StorageProvider {
    const provider = process.env.STORAGE_PROVIDER || 'local';

    // In the future, we can add S3, Azure, etc. here
    switch (provider) {
        case 's3':
            // return new S3StorageProvider(); // To be implemented
            throw new Error('S3 storage not yet implemented');
        case 'local':
        default:
            return new LocalStorageProvider();
    }
}
