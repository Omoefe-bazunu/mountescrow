// CREATE FILE: app/api/proposals/[id]/accept-and-fund/route.js

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(request, { params }) {
  const cookie = request.headers.get("cookie") ?? "";
  const { id } = await params;
  const body = await request.json();

  const res = await fetch(
    `${BACKEND_URL}/api/proposals/${id}/accept-and-fund`,
    {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include",
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    return new NextResponse(errorText, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
