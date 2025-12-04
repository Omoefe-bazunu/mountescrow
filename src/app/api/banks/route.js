// app/api/banks/route.js
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  try {
    const cookie = request.headers.get("cookie") || "";

    const res = await fetch(`${BACKEND_URL}/api/banks`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Backend /api/banks failed:", res.status, data);
      return NextResponse.json(
        { error: "Failed to fetch banks from server" },
        { status: 500 }
      );
    }

    // Make sure we return exactly { banks: [...] }
    return NextResponse.json({ banks: data.banks || [] });
  } catch (err) {
    console.error("CRITICAL: /api/banks proxy crashed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
