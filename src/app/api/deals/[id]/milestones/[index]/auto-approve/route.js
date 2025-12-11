import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(request, { params }) {
  const { id, index } = await params;
  const authHeader = request.headers.get("authorization");

  const res = await fetch(
    `${BACKEND_URL}/api/deals/${id}/milestones/${index}/auto-approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || "",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
