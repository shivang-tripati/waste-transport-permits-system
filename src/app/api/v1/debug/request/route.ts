import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    return Response.json({
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        xForwardedFor: request.headers.get('x-forwarded-for'),
        xForwardedProto: request.headers.get('x-forwarded-proto'),
        cookieHeader: request.headers.get('cookie'),
        userAgent: request.headers.get('user-agent'),
    });
}
