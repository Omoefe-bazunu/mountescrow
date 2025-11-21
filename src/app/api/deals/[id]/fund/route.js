// ────── app/api/deals/[id]/fund/route.js ──────
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(request, { params }) {
  const cookie = request.headers.get("cookie") ?? "";
  const { id } = await params;

  const res = await fetch(`${BACKEND_URL}/api/deals/${id}/fund`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
