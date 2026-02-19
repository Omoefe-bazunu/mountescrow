import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function PATCH(request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";

    const csrfToken =
      cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("csrf-token="))
        ?.split("=")[1] ?? "";

    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/users/kyc-status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("KYC status proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
