import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  const cookie = request.headers.get("cookie") ?? "";
  const csrfToken = request.headers.get("x-csrf-token") ?? ""; // Extract CSRF token from frontend request

  const res = await fetch(`${BACKEND_URL}/api/wallet/withdraw/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      "x-csrf-token": csrfToken, // Forward CSRF token to backend
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
