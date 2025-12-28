import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request, { params }) {
  const { id } = params;
  const cookie = request.headers.get("cookie") ?? "";

  const res = await fetch(`${BACKEND_URL}/api/deals/${id}/review-status`, {
    headers: { Cookie: cookie },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
