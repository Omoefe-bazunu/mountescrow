import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  const cookie = request.headers.get("cookie") || "";

  try {
    const res = await fetch(`${BACKEND}/api/admin/users`, {
      method: "GET",
      headers: {
        cookie,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });
    response.headers.delete("set-cookie");
    return response;
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
