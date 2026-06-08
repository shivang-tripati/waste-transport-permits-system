import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractBearerToken, verifyAccessTokenEdge } from '@/lib/auth/edge';

// Public routes - exact matches only
const publicExactRoutes = [
    '/',
    '/login',
    '/api/auth/login',
    '/api/auth/refresh',
    '/verify',
    '/compliance/verify',
    '/unauthorized',
    '/favicon.ico',
];

// Public route prefixes - anything starting with these is public
const publicPrefixes = [
    '/_next',
];

// Define routes that require admin access
const adminRoutes = ['/admin', '/admin/permits', '/admin/users', '/admin/settings'];

// Define routes that require company access
const companyRoutes = ['/company', '/company/permits', '/company/compliance'];

async function validateSession(request: NextRequest, token: string) {
    const url = new URL('/api/v1/auth/validate', request.url);
    const headers = new Headers();

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        headers.set('cookie', cookieHeader);
    }

    try {
        return await fetch(url.toString(), {
            method: 'GET',
            headers,
            cache: 'no-store',
        });
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for public routes (exact match) and public prefixes
    if (
        publicExactRoutes.includes(pathname) ||
        publicPrefixes.some(prefix => pathname.startsWith(prefix))
    ) {
        return NextResponse.next();
    }

    // Skip API routes that handle their own auth
    if (pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    const authHeader = request.headers.get('authorization');
    let token = extractBearerToken(authHeader);

    if (!token) {
        token = request.cookies.get('accessToken')?.value ?? null;
    }

    if (!token) {
        const url = new URL('/unauthorized', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    const decoded = await verifyAccessTokenEdge(token);

    if (!decoded) {
        const url = new URL('/unauthorized', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    const validationResponse = await validateSession(request, token);
    if (!validationResponse || validationResponse.status !== 200) {
        const url = new URL('/unauthorized', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    const payload = await validationResponse.json();
    const user = payload?.data?.user ?? payload?.user;

    if (!user) {
        const url = new URL('/unauthorized', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    if (adminRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
        if (user.role !== 'ADMIN') {
            const url = new URL('/unauthorized', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
    }

    if (companyRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
        if (user.role !== 'COMPANY_USER' && user.role !== 'ADMIN') {
            const url = new URL('/unauthorized', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};