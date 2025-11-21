import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// GET all deals
export async function GET(request) {
  const cookie = request.headers.get("cookie") ?? "";

  const res = await fetch(`${BACKEND_URL}/api/deals`, {
    method: "GET",
    headers: { Cookie: cookie },
    credentials: "include",
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
