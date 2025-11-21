import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  const formData = await request.formData();
  const cookie = request.headers.get("cookie") ?? "";
  const csrfToken = request.headers.get("x-csrf-token") ?? "";

  const res = await fetch(`${BACKEND_URL}/api/proposals`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      "x-csrf-token": csrfToken,
    },
    body: formData,
    credentials: "include",
  });

  const data = await res.text();
  const response = new NextResponse(data, { status: res.status });

  const setCookieHeaders = res.headers.getSetCookie();
  if (setCookieHeaders && setCookieHeaders.length > 0) {
    setCookieHeaders.forEach((cookie) => {
      response.headers.append("set-cookie", cookie);
    });
  }

  return response;
}

export async function GET(request) {
  const cookie = request.headers.get("cookie") ?? "";

  const res = await fetch(`${BACKEND_URL}/api/proposals`, {
    method: "GET",
    headers: { Cookie: cookie },
    credentials: "include",
  });

  const data = await res.text();
  return new NextResponse(data, { status: res.status });
}
