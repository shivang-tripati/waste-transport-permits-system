import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';

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

    // Authenticate user
    const authResult = await authenticate(request);

    // If not authenticated, redirect to unauthorized
    if (!authResult.success) {
        const url = new URL('/unauthorized', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    const { user } = authResult;

    // Check admin routes
    if (adminRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
        if (user.role !== 'ADMIN') {
            const url = new URL('/unauthorized', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
    }

    // Check company routes
    if (companyRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
        if (user.role !== 'COMPANY_USER' && user.role !== 'ADMIN') {
            const url = new URL('/unauthorized', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
    }

    // Allow access
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