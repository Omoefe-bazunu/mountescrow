// Middleware for rate limiting and authentication
import { NextRequest, NextResponse } from "next/server";
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

const protectedRoutes = ["/api/deals", "/api/proposals"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

  if (ratelimit && pathname.startsWith("/api/auth")) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new NextResponse(
        JSON.stringify({ message: "Too many requests" }),
        { status: 429 }
      );
    }
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const authorization = request.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return new NextResponse(
        JSON.stringify({ message: "Unauthorized: No token" }),
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*"] };
