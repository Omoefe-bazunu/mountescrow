import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request, { params }) {
  const { id } = await params;
  const cookie = request.headers.get("cookie") || "";

  try {
    const res = await fetch(`${BACKEND}/api/disputes/${id}/resolve`, {
      method: "POST",
      headers: {
        cookie,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await res.json();

    const response = NextResponse.json(data, { status: res.status });
    response.headers.delete("set-cookie");

    return response;
  } catch (error) {
    console.error("Resolve dispute API error:", error);
    return NextResponse.json(
      { error: "Failed to resolve dispute" },
      { status: 500 }
    );
  }
}
