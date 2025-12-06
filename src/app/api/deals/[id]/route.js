// app/api/deals/[id]/route.js — FINAL BULLETPROOF VERSION

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET(request, { params }) {
  const cookie = request.headers.get("cookie") ?? "";
  const { id } = await params;

  try {
    const res = await fetch(`${BACKEND_URL}/api/deals/${id}`, {
      method: "GET",
      headers: { Cookie: cookie },
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      return new NextResponse(text || "Deal not found", { status: res.status });
    }

    const data = await res.json();
    const deal = data.deal || data;

    // SAFELY NORMALIZE MILESTONES — THIS CANNOT CRASH
    if (deal.milestones && typeof deal.milestones === "object") {
      if (Array.isArray(deal.milestones)) {
        // Already good
      } else {
        // Firestore map → convert to array safely
        try {
          deal.milestones = Object.entries(deal.milestones)
            .map(([key, value]) => ({
              ...value,
              index: parseInt(key, 10),
            }))
            .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        } catch (e) {
          console.error("Failed to parse milestones:", e);
          deal.milestones = [];
        }
      }
    } else {
      deal.milestones = [];
    }

    // Convert timestamps safely
    const toISO = (ts) => {
      if (!ts) return null;
      try {
        const seconds = ts._seconds ?? ts.seconds;
        const nanoseconds = ts._nanoseconds ?? ts.nanoseconds ?? 0;
        if (seconds != null) {
          return new Date(
            seconds * 1000 + Math.round(nanoseconds / 1000000)
          ).toISOString();
        }
      } catch (e) {
        console.error("Timestamp parse error:", e);
      }
      return null;
    };

    deal.createdAt = toISO(deal.createdAt);
    deal.fundedAt = toISO(deal.fundedAt);

    // Convert dueDate in milestones
    if (Array.isArray(deal.milestones)) {
      deal.milestones = deal.milestones.map((m) => ({
        ...m,
        dueDate: toISO(m.dueDate),
      }));
    }

    return NextResponse.json({ deal }, { status: 200 });
  } catch (error) {
    console.error("Deal route error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
