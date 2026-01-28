import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

// PATCH - Update deletion request status (Admin only)
export async function PATCH(request, { params }) {
  try {
    const { requestId } = params;
    const body = await request.json();
    const cookies = request.cookies;
    const token = cookies.get("token")?.value;

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

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
