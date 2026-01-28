import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

// Environment variables with defaults for development
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-minimum-32-characters-long!!!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-minimum-32-characters!!';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Payload structure for access tokens
 */
export interface AccessTokenPayload {
    userId: string;
    email: string;
    role: UserRole;
    companyId?: string | null;
}

/**
 * Payload structure for refresh tokens
 */
export interface RefreshTokenPayload {
    userId: string;
    tokenId: string; // Unique ID for this refresh token (stored in DB)
}

/**
 * Decoded token with standard JWT claims
 */
export interface DecodedToken<T> extends JwtPayload {
    data: T;
}

/**
 * Generate an access token
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
    const options: SignOptions = {
        expiresIn: JWT_ACCESS_EXPIRY as string,
        algorithm: 'HS256',
    };

    return jwt.sign({ data: payload }, JWT_SECRET, options);
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
    const options: SignOptions = {
        expiresIn: JWT_REFRESH_EXPIRY as string,
        algorithm: 'HS256',
    };

    return jwt.sign({ data: payload }, JWT_REFRESH_SECRET, options);
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): DecodedToken<AccessTokenPayload> | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken<AccessTokenPayload>;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): DecodedToken<RefreshTokenPayload> | null {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as DecodedToken<RefreshTokenPayload>;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Parse expiry string to milliseconds
 */
export function parseExpiryToMs(expiry: string): number {
    const match = expiry.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
        return 15 * 60 * 1000; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's':
            return value * 1000;
        case 'm':
            return value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'd':
            return value * 24 * 60 * 60 * 1000;
        default:
            return 15 * 60 * 1000;
    }
}

/**
 * Get refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
    const expiryMs = parseExpiryToMs(JWT_REFRESH_EXPIRY as string);
    return new Date(Date.now() + expiryMs);
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7);
}
