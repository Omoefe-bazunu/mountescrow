import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  const body = await request.text();
  const cookie = request.headers.get("cookie") ?? "";

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/resend-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body,
      credentials: "include",
    });

    const data = await res.text();

    const response = new NextResponse(data, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Forward any set-cookie headers from backend if they exist
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend server" },
      { status: 500 }
    );
  }
}
