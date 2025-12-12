import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// 1. Mark the second argument destructing as 'props' or similar to access params properly
export async function POST(request, props) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const csrfToken = request.headers.get("x-csrf-token") || "";

    // 2. AWAIT the params here
    const params = await props.params;
    const { id, index } = params;

    // Debug log to confirm ID is now captured
    console.log(
      `🚀 Forwarding auto-start-countdown for deal ${id}, milestone ${index}`
    );

    const res = await fetch(
      `${BACKEND_URL}/api/deals/${id}/milestones/${index}/auto-start-countdown`,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
          "x-csrf-token": csrfToken,
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    const data = await res.json();

    if (!res.ok) {
      console.error("Backend error:", data);
      return NextResponse.json(
        { error: data.error || "Failed to start countdown" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
