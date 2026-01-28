import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

// GET all deletion requests (Admin only)
export async function GET(request) {
  try {
    const cookies = request.cookies;
    const token = cookies.get("token")?.value;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let url = `${BACKEND}/api/data-deletion/requests`;
    if (status) {
      url += `?status=${status}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Fetch deletion requests API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch deletion requests" },
      { status: 500 },
    );
  }
}
