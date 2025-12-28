import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  const cookie = request.headers.get("cookie") ?? "";
  const res = await fetch(`${BACKEND_URL}/api/admin/special-clients`, {
    headers: { Cookie: cookie },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request) {
  const body = await request.json();
  const cookie = request.headers.get("cookie") ?? "";
  const res = await fetch(`${BACKEND_URL}/api/admin/special-clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
