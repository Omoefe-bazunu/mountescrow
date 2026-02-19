import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  const body = await request.json();
  const cookie = request.headers.get("cookie") ?? "";

  const csrfToken =
    cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("csrf-token="))
      ?.split("=")[1] ?? "";

  const res = await fetch(`${BACKEND_URL}/api/wallet/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const response = NextResponse.json(data, { status: res.status });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}
