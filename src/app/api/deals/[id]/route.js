export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET(request, { params }) {
  const cookie = request.headers.get("cookie") ?? "";
  const { id } = await params;

  const res = await fetch(`${BACKEND_URL}/api/deals/${id}`, {
    method: "GET",
    headers: { Cookie: cookie },
    credentials: "include",
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const data = await res.json();

  // Extract deal from wrapper - backend returns { deal: {...} }
  const deal = data.deal || data;

  // Convert Firestore timestamps to ISO strings
  if (deal.createdAt && typeof deal.createdAt === "object") {
    const seconds = deal.createdAt._seconds || deal.createdAt.seconds;
    const nanoseconds =
      deal.createdAt._nanoseconds || deal.createdAt.nanoseconds || 0;
    if (seconds) {
      deal.createdAt = new Date(
        seconds * 1000 + Math.round(nanoseconds / 1000000)
      ).toISOString();
    }
  }

  if (deal.fundedAt && typeof deal.fundedAt === "object") {
    const seconds = deal.fundedAt._seconds || deal.fundedAt.seconds;
    const nanoseconds =
      deal.fundedAt._nanoseconds || deal.fundedAt.nanoseconds || 0;
    if (seconds) {
      deal.fundedAt = new Date(
        seconds * 1000 + Math.round(nanoseconds / 1000000)
      ).toISOString();
    }
  }

  // Convert milestone dates
  if (deal.milestones && Array.isArray(deal.milestones)) {
    deal.milestones = deal.milestones.map((milestone) => {
      if (milestone.dueDate && typeof milestone.dueDate === "object") {
        const seconds = milestone.dueDate._seconds || milestone.dueDate.seconds;
        const nanoseconds =
          milestone.dueDate._nanoseconds || milestone.dueDate.nanoseconds || 0;
        if (seconds) {
          milestone.dueDate = new Date(
            seconds * 1000 + Math.round(nanoseconds / 1000000)
          ).toISOString();
        }
      }
      return milestone;
    });
  }

  // Return in expected format
  return NextResponse.json({ deal }, { status: 200 });
}
