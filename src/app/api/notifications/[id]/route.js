import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function PATCH(request, { params }) {
  try {
    // FIX: Await params and cookies in Next.js 15 [cite: 807, 834]
    const { id } = await params;
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const csrfToken = cookieStore.get("csrf-token")?.value;

    if (!jwt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Forward the PATCH to the Express backend
    // Note: Backend still expects /read in its route
    const response = await fetch(
      `${BACKEND_URL}/api/notifications/${id}/read`,
      {
        method: "PATCH",
        headers: {
          Cookie: `jwt=${jwt}; csrf-token=${csrfToken}`,
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
      }
    );

    const data = await response.json();
    if (!response.ok)
      return NextResponse.json(data, { status: response.status });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Mark as read proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // FIX: Await params and cookies in Next.js 15 [cite: 814, 858]
    const { id } = await params;
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const csrfToken = cookieStore.get("csrf-token")?.value;

    if (!jwt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/notifications/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: `jwt=${jwt}; csrf-token=${csrfToken}`,
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
    });

    const data = await response.json();
    if (!response.ok)
      return NextResponse.json(data, { status: response.status });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Delete notification proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
