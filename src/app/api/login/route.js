import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  try {
    const body = await request.text();
    const cookie = request.headers.get("cookie") ?? "";

    // IMPORTANT: Path must be /api/auth/login to match your app.js
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body,
    });

    // SAFETY CHECK: If the backend sends an error (like 404 or 500)
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend Error Response:", errorText);
      return NextResponse.json(
        { error: `Backend returned ${res.status}. Check your server console.` },
        { status: res.status },
      );
    }

    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });

    // Extract multiple cookies (JWT and CSRF) correctly
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
  } catch (err) {
    console.error("Login Proxy Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
