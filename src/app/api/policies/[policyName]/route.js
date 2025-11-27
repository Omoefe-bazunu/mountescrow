import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function DELETE(request, { params }) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfToken = request.headers.get("x-csrf-token") ?? "";
    const { policyName } = params;

    const res = await fetch(
      `${BACKEND_URL}/api/policies/${encodeURIComponent(policyName)}`,
      {
        method: "DELETE",
        headers: {
          Cookie: cookie,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
      }
    );

    const data = await res.json();

    const response = NextResponse.json(data, { status: res.status });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (error) {
    console.error("Delete policy proxy error:", error);
    return NextResponse.json(
      { error: "Failed to delete policy" },
      { status: 500 }
    );
  }
}
