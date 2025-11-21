// ────── app/api/deals/create-from-proposal/route.js ──────
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  const cookie = request.headers.get("cookie") ?? "";
  const body = await request.json();

  const res = await fetch(`${BACKEND_URL}/api/deals/create-from-proposal`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
