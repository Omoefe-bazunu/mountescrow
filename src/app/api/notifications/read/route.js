import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function PATCH(request, { params }) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const csrfToken = request.headers.get("x-csrf-token") || "";
    const { id } = params;

    const res = await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
      method: "PATCH",
      headers: {
        Cookie: cookie,
        "x-csrf-token": csrfToken,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to mark notification as read" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Update notification API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
