import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function PATCH(request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const body = await request.json();

  // ⬅️ EXTRACT CSRF TOKEN FROM COOKIES (not from headers)
  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});

  const csrfToken = cookies["csrf-token"] || "";

  console.log("🌐 Proxy forwarding update-profile:", {
    hasCookie: !!cookieHeader,
    hasCsrfToken: !!csrfToken,
    csrfTokenValue: csrfToken.substring(0, 10) + "...", // Log first 10 chars
  });

  const res = await fetch(`${BACKEND_URL}/api/users/update-profile`, {
    method: "PATCH",
    headers: {
      Cookie: cookieHeader,
      "X-CSRF-Token": csrfToken, // ⬅️ Now forwarding the token from cookies
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Backend error:", text);
    return new NextResponse(text, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
