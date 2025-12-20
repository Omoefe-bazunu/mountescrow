import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  try {
    // FIX: Add await here for Next.js 15
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const csrfToken = cookieStore.get("csrf-token")?.value;

    if (!jwt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/notifications/count`, {
      method: "GET",
      headers: {
        Cookie: `jwt=${jwt}; csrf-token=${csrfToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Notification count API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification count" },
      { status: 500 }
    );
  }
}
