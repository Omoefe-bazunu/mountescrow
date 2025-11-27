import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfToken = request.headers.get("x-csrf-token") ?? "";

    // Get the FormData from the request
    const formData = await request.formData();

    const res = await fetch(`${BACKEND_URL}/api/policies/upload`, {
      method: "POST",
      headers: {
        Cookie: cookie,
        "X-CSRF-Token": csrfToken,
      },
      credentials: "include",
      body: formData,
    });

    const data = await res.json();

    const response = NextResponse.json(data, { status: res.status });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (error) {
    console.error("Upload policy proxy error:", error);
    return NextResponse.json(
      { error: "Failed to upload policy" },
      { status: 500 }
    );
  }
}
