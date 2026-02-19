import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  const cookie = request.headers.get("cookie") ?? "";

  const csrfToken =
    cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("csrf-token="))
      ?.split("=")[1] ?? "";

  const res = await fetch(`${BACKEND_URL}/api/wallet/withdraw/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      "x-csrf-token": csrfToken,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
