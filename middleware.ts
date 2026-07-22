import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractBearerToken, verifyAccessTokenEdge } from '@/lib/auth/edge';
import { log } from '@/lib/logger';

const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://127.0.0.1:3000';


// Public routes - exact matches only
const publicExactRoutes = [
    '/',
    '/login',
    '/register',
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/forget-password',
    '/api/v1/auth/refresh',
    '/api/v1/auth/validate',
    '/api/v1/auth/logout',
    '/api/v1/account/delete-request',
    '/delete-account',
    '/verify',
    '/compliance',
    '/compliance/verify',
    '/unauthorized',
    '/favicon.ico',
];

// Public route prefixes - anything starting with these is public
const publicPrefixes = [
    '/_next',
    '/public',
    '/about',
    '/compliance',
    '/compliance/verify',
    '/delete-account',
    '/verify',
    '/privacy-policy',
    '/contact',
    '/terms-of-service',

];

// Define routes that require admin access
const adminRoutes = ['/admin', '/admin/permits', '/admin/users', '/admin/settings'];

// Define routes that require company access
const companyRoutes = ['/company', '/company/permits', '/company/compliance'];

async function validateSession(request: NextRequest, token: string) {
    const url = new URL(
        '/api/v1/auth/validate',
        baseUrl
    );
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
    } catch (error) {
        log.error(
            '[AUTH_DEBUG] Validate fetch failed:',
            error
        );
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const cookieHeader = request.headers.get('cookie') ?? '';
    const cookieNames = cookieHeader.split(';').map((entry) => entry.split('=')[0]?.trim()).filter(Boolean);


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