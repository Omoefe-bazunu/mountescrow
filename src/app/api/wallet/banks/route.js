// app/api/banks/route.js
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";

    const res = await fetch(`${BACKEND_URL}/api/banks`, {
      method: "GET",
      headers: {
        Cookie: cookie,
      },
    });

    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Banks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch banks", message: error.message },
      { status: 500 }
    );
  }
}
