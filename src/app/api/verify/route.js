import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  try {
    const body = await request.text();
    const cookie = request.headers.get("cookie") ?? "";

    // Capture the CSRF token from the browser header
    const csrfToken = request.headers.get("x-csrf-token") ?? "";

    // Ensure the path matches your modular backend
    // Note: If you moved this to authRoutes, the path should be /api/auth/verify
    const res = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        "x-csrf-token": csrfToken, // Forward security token
      },
      body,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Verification Backend Error:", errorText);
      return NextResponse.json(
        { error: `Backend returned ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });

    // Handle multiple cookies (JWT and CSRF) correctly
    const setCookies = res.headers.getSetCookie
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie");

    if (setCookies) {
      if (Array.isArray(setCookies)) {
        // Appends each cookie as an individual header
        setCookies.forEach((c) => response.headers.append("set-cookie", c));
      } else {
        response.headers.set("set-cookie", setCookies);
      }
    }

    return response;
  } catch (err) {
    console.error("Verification Proxy Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
