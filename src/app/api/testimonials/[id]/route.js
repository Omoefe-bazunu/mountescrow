// app/api/testimonials/[id]/route.js
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request, { params }) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfToken = request.headers.get("x-csrf-token") ?? "";

    const res = await fetch(`${BACKEND_URL}/api/testimonials/${params.id}`, {
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
    console.error("Testimonial by ID proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonial" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfToken = request.headers.get("x-csrf-token") ?? "";

    const formData = await request.formData();

    const res = await fetch(`${BACKEND_URL}/api/testimonials/${params.id}`, {
      method: "PATCH",
      headers: {
        Cookie: cookie,
        "x-csrf-token": csrfToken,
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
    console.error("Update testimonial proxy error:", error);
    return NextResponse.json(
      { error: "Failed to update testimonial" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfToken = request.headers.get("x-csrf-token") ?? "";

    const res = await fetch(`${BACKEND_URL}/api/testimonials/${params.id}`, {
      method: "DELETE",
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
    console.error("Delete testimonial proxy error:", error);
    return NextResponse.json(
      { error: "Failed to delete testimonial" },
      { status: 500 }
    );
  }
}
