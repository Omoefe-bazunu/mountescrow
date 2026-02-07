import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  const cookie = request.headers.get("cookie") ?? "";

  const res = await fetch(`${BACKEND_URL}/api/auth/check`, {
    method: "GET",
    headers: { Cookie: cookie },
    credentials: "include",
  });

  const data = await res.text();
  const response = new NextResponse(data, { status: res.status });

  // FIXED: Handles multiple cookies correctly so the browser sees both JWT and CSRF
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
