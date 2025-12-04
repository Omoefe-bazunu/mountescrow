// app/api/deals/[id]/milestones/[index]/auto-approval-status/route.js
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET(request, { params }) {
  try {
    const { id, index } = await params;
    const cookie = request.headers.get("cookie") || "";
    const csrfToken = request.headers.get("x-csrf-token") || "";

    const res = await fetch(
      `${BACKEND_URL}/api/deals/${id}/milestones/${index}/auto-approval-status`,
      {
        headers: {
          Cookie: cookie,
          "x-csrf-token": csrfToken,
        },
        credentials: "include",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Failed to fetch status" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Auto-approval status proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
