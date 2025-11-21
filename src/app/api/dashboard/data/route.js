// app/api/dashboard/data/route.js
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";

    const res = await fetch(`${BACKEND_URL}/api/dashboard/data`, {
      method: "GET",
      headers: { Cookie: cookie },
      credentials: "include",
    });

    const contentType = res.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } else {
      const text = await res.text();
      console.error("❌ Backend returned non-JSON:", text.substring(0, 200));

      try {
        const data = JSON.parse(text);
        return NextResponse.json(data, { status: res.status });
      } catch {
        return NextResponse.json(
          { error: "Backend error", details: text.substring(0, 500) },
          { status: res.status }
        );
      }
    }
  } catch (error) {
    console.error("❌ Proxy error in GET /api/dashboard/data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
