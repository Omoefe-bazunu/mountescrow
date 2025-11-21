// middleware.js
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

let ratelimit = null;

if (
  process.env.NODE_ENV === "production" &&
  process.env.KV_REST_API_URL &&
  process.env.KV_REST_API_TOKEN
) {
  ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
  });
}

/** @param {import('next/server').NextRequest} request */
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

  // Rate limiting for auth endpoints
  if (ratelimit && pathname.startsWith("/api/auth")) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new NextResponse(
        JSON.stringify({ message: "Too many requests" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // REMOVED: Protected route authentication check
  // Your backend handles authentication via JWT cookies
  // The middleware was blocking requests because it expected Bearer tokens
  // but your app uses cookie-based auth

  // FOR API ROUTES: Forward cookies properly
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();

    // Ensure cookies are forwarded to API routes
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      response.cookies.set("forwarded-cookies", cookieHeader);
    }

    return response;
  }

  // Generate nonce for CSP (only for non-API routes)
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const VERCEL_LIVE_SOURCES = "https://vercel.live https://vercel.com";
  const PUSHER_SOURCES = "*.pusher.com *.pusherapp.com";

  const cspHeader = `
    default-src 'self';
    connect-src 'self' ${isDev ? "ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*" : ""} wss://*.firebaseio.com https://*.firebaseio.com https://firestore.googleapis.com https://*.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firebaseinstallations.googleapis.com https://vitals.vercel-insights.com ${VERCEL_LIVE_SOURCES} ${PUSHER_SOURCES};
    style-src 'self' https://fonts.googleapis.com 'unsafe-inline';
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob: https://source.unsplash.com https://firebasestorage.googleapis.com https://storage.googleapis.com https://placehold.co;
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' 'wasm-unsafe-eval'${isDev ? " 'unsafe-inline'" : ""};
    frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.firebaseapp.com https://*.google.com ${VERCEL_LIVE_SOURCES};
    object-src 'none';
    frame-ancestors 'self';
    base-uri 'self';
    form-action 'self';
    ${isDev ? "" : "upgrade-insecure-requests;"}
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
