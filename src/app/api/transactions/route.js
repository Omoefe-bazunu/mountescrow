// app/api/transactions/route.js
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";

    const res = await fetch(`${BACKEND_URL}/api/transactions`, {
      headers: { Cookie: cookie },
      credentials: "include",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Transactions proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
