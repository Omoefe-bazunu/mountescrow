import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  const body = await request.text();
  const cookie = request.headers.get("cookie") ?? "";

  // Note: Ensure the path is /api/auth/signup to match your modular routes
  const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body,
    credentials: "include",
  });

  const data = await res.text();
  const response = new NextResponse(data, { status: res.status });

  const setCookies = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : res.headers.get("set-cookie");

  if (setCookies) {
    if (Array.isArray(setCookies)) {
      setCookies.forEach((c) => response.headers.append("set-cookie", c));
    } else {
      response.headers.set("set-cookie", setCookies);
    }
  }

  return response;
}
