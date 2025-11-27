import { NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get("dealId");
  const cookie = request.headers.get("cookie") ?? "";

  const res = await fetch(`${BACKEND}/api/disputes/check?dealId=${dealId}`, {
    headers: { Cookie: cookie },
    credentials: "include",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
