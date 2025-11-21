// app/api/users/me/route.js
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";

    const res = await fetch(`${BACKEND_URL}/api/auth/check`, {
      headers: { Cookie: cookie },
      credentials: "include",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await res.json();

    // Return just the user object from the response
    return NextResponse.json(data.user);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
