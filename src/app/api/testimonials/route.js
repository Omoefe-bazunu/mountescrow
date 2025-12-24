// app/api/testimonials/route.js
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfToken = request.headers.get("x-csrf-token") ?? "";

    const res = await fetch(`${BACKEND_URL}/api/testimonials`, {
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
    console.error("Testimonials proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfToken = request.headers.get("x-csrf-token") ?? "";

    // Handle FormData for file uploads
    const formData = await request.formData();

    const res = await fetch(`${BACKEND_URL}/api/testimonials`, {
      method: "POST",
      headers: {
        Cookie: cookie,
        "x-csrf-token": csrfToken,
        // Don't set Content-Type for FormData - browser sets it with boundary
      },
      body: formData,
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
    console.error("Create testimonial proxy error:", error);
    return NextResponse.json(
      { error: "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
