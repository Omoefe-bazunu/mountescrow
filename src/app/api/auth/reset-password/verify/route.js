import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  const body = await request.json();
  const cookie = request.headers.get("cookie") ?? "";

  const res = await fetch(`${BACKEND_URL}/api/auth/reset-password/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
    credentials: "include",
  });

  const data = await res.json();
  const response = NextResponse.json(data, { status: res.status });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}
