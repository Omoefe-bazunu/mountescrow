// app/api/proposals/[id]/route.js
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET(request, { params }) {
  const cookie = request.headers.get("cookie") ?? "";
  const { id } = await params;

  const res = await fetch(`${BACKEND_URL}/api/proposals/${id}`, {
    method: "GET",
    headers: { Cookie: cookie },
    credentials: "include",
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const data = await res.json();
  const proposal = data.proposal || data;

  // Helper function to convert Firestore timestamp to ISO string
  function convertTimestamp(timestamp) {
    if (!timestamp) return null;

    // Already a string (ISO format)
    if (typeof timestamp === "string") {
      return timestamp;
    }

    // Firestore timestamp object
    const seconds = timestamp._seconds || timestamp.seconds;
    const nanoseconds = timestamp._nanoseconds || timestamp.nanoseconds || 0;

    if (seconds != null) {
      return new Date(
        seconds * 1000 + Math.round(nanoseconds / 1000000)
      ).toISOString();
    }

    return null;
  }

  // Convert all timestamps
  if (proposal.createdAt) {
    proposal.createdAt = convertTimestamp(proposal.createdAt);
  }

  // Convert milestone due dates
  if (proposal.milestones && Array.isArray(proposal.milestones)) {
    proposal.milestones = proposal.milestones.map((milestone) => ({
      ...milestone,
      dueDate: convertTimestamp(milestone.dueDate),
    }));
  }

  return NextResponse.json({ proposal }, { status: 200 });
}
