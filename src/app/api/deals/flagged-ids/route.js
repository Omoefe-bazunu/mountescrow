import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request) {
  const cookie = request.headers.get("cookie") ?? "";
  const res = await fetch(`${BACKEND_URL}/api/admin/fraud-reviews`, {
    headers: { Cookie: cookie },
  });

  if (!res.ok) return NextResponse.json({ flaggedIds: [] });

  const data = await res.json();
  // Extract just the IDs for easy checking on the frontend
  const flaggedIds = (data.reviews || []).map((review) => review.dealId);

  return NextResponse.json({ flaggedIds });
}
