import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  try {
    const token = request.cookies.get("jwt")?.value; // ✅ Changed from "token" to "jwt"

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const headers = {
      "Content-Type": "application/json",
      Cookie: `jwt=${token}`, // ✅ Changed from "token" to "jwt"
    };

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
