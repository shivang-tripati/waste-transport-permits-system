import { AccessTokenPayload, DecodedToken } from './jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-minimum-32-characters-long!!!';

function base64UrlDecode(value: string): Uint8Array {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function base64UrlDecodeToString(value: string): string {
    const bytes = base64UrlDecode(value);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}

async function verifyHmacSha256(message: string, signature: string, secret: string): Promise<boolean> {
    const keyData = new TextEncoder().encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData as BufferSource,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );

    const signatureBytes = base64UrlDecode(signature);
    const data = new TextEncoder().encode(message);

    return crypto.subtle.verify('HMAC', cryptoKey, signatureBytes as BufferSource, data as BufferSource);
}

export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7);
}

export async function verifyAccessTokenEdge(
    token: string
): Promise<DecodedToken<AccessTokenPayload> | null> {
    
    const parts = token.split('.');
    if (parts.length !== 3) {
        return null;
    }

    const [header, payload, signature] = parts;
    const message = `${header}.${payload}`;

    const verified = await verifyHmacSha256(message, signature, JWT_SECRET);
    if (!verified) {
        return null;
    }

    try {
        const payloadJson = base64UrlDecodeToString(payload);
        const decoded = JSON.parse(payloadJson) as DecodedToken<AccessTokenPayload>;
        return decoded;
    } catch (error) {
        console.log(`[AUTH_DEBUG] JWT verification failed reason: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}
