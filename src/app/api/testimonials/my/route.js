// app/api/testimonials/my/route.js
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfToken = request.headers.get("x-csrf-token") ?? "";

    const res = await fetch(`${BACKEND_URL}/api/testimonials/my`, {
      method: "GET",
      headers: {
        Cookie: cookie,
        "x-csrf-token": csrfToken,
      },
      credentials: "include",
    });

    const data = await res.json();

    const response = NextResponse.json(data, { status: res.status });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (error) {
    console.error("My testimonial proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user testimonial" },
      { status: 500 }
    );
  }
}
