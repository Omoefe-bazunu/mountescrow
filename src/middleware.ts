import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// Initialize ratelimiter
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 requests per 60 seconds
});

// List of routes to protect with authentication
const protectedRoutes = [
  '/api/deals',
  '/api/proposals',
  '/api/wallet',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.ip ?? '127.0.0.1';

  // Apply rate limiting to sensitive auth and api routes
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/wallet')) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new NextResponse(
        JSON.stringify({ message: 'Too many requests. Please try again later.' }),
        { status: 429 }
      );
    }
  }
  
  // Protect webhook route
  if (pathname === '/api/webhook/fcmb') {
      // In a real production scenario, you'd check a secret header or whitelist IPs.
      // For now, we allow it but you should add more robust security here.
      // For example:
      // const fcmbSecret = request.headers.get('x-fcmb-secret');
      // if (fcmbSecret !== process.env.FCMB_WEBHOOK_SECRET) {
      //     return new NextResponse('Unauthorized', { status: 401 });
      // }
      return NextResponse.next();
  }

  // For protected API routes, we'll handle auth verification in the API routes themselves
  // since we can't use Firebase Admin SDK in Edge Runtime
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized: No token provided' }),
        { status: 401 }
      );
    }
    // Token verification will be done in individual API routes using Node.js runtime
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};