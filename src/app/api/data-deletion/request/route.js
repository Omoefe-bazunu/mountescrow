import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  try {
    const body = await request.json();
    const cookies = request.cookies;

    // Get the auth token from cookies
    const token = cookies.get("token")?.value;

    const headers = {
      "Content-Type": "application/json",
    };

    // Add authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BACKEND}/api/data-deletion/request`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Data deletion request API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit deletion request" },
      { status: 500 },
    );
  }
}
