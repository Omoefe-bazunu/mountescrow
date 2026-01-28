import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function PATCH(request, { params }) {
  try {
    const { requestId } = params;
    const body = await request.json();
    const token = request.cookies.get("jwt")?.value; // ✅ Changed from "token" to "jwt"

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const headers = {
      "Content-Type": "application/json",
      Cookie: `jwt=${token}`, // ✅ Changed from "token" to "jwt"
    };

    const res = await fetch(
      `${BACKEND}/api/data-deletion/requests/${requestId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Update deletion request API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update deletion request" },
      { status: 500 },
    );
  }
}
