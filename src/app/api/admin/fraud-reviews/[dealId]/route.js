import { NextResponse } from "next/server";
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function DELETE(request, { params }) {
  const { dealId } = params;
  const cookie = request.headers.get("cookie") ?? "";
  const res = await fetch(`${BACKEND_URL}/api/admin/fraud-reviews/${dealId}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
