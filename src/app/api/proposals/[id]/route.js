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

  // Convert Firestore timestamp objects to ISO strings for proper serialization
  if (data.createdAt && typeof data.createdAt === "object") {
    if (data.createdAt._seconds || data.createdAt.seconds) {
      const seconds = data.createdAt._seconds || data.createdAt.seconds;
      const nanoseconds =
        data.createdAt._nanoseconds || data.createdAt.nanoseconds || 0;
      data.createdAt = new Date(
        seconds * 1000 + Math.round(nanoseconds / 1000000)
      ).toISOString();
    }
  }

  // Convert milestone due dates
  if (data.milestones && Array.isArray(data.milestones)) {
    data.milestones = data.milestones.map((milestone) => {
      if (milestone.dueDate && typeof milestone.dueDate === "object") {
        if (milestone.dueDate._seconds || milestone.dueDate.seconds) {
          const seconds =
            milestone.dueDate._seconds || milestone.dueDate.seconds;
          const nanoseconds =
            milestone.dueDate._nanoseconds ||
            milestone.dueDate.nanoseconds ||
            0;
          milestone.dueDate = new Date(
            seconds * 1000 + Math.round(nanoseconds / 1000000)
          ).toISOString();
        }
      }
      return milestone;
    });
  }

  return NextResponse.json(data, { status: res.status });
}
