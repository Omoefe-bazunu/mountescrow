import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  const cookie = request.headers.get("cookie") ?? "";

  const res = await fetch(`${BACKEND_URL}/api/special-client`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { isSpecialClient: false },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
