// // app/api/deals/[id]/milestones/[index]/reject/route.js - FIXED
// import { NextResponse } from "next/server";

// const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// export async function POST(request, { params }) {
//   const cookie = request.headers.get("cookie") ?? "";
//   const csrfToken = request.headers.get("x-csrf-token") ?? "";
//   const { id, index } = await params;
//   const body = await request.json();

//   const res = await fetch(
//     `${BACKEND_URL}/api/deals/${id}/milestones/${index}/reject`,
//     {
//       method: "POST",
//       headers: {
//         Cookie: cookie,
//         "x-csrf-token": csrfToken,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(body),
//       credentials: "include",
//     }
//   );

//   if (!res.ok) {
//     const text = await res.text();
//     return new NextResponse(text, { status: res.status });
//   }

//   const data = await res.json();
//   return NextResponse.json(data, { status: 200 });
// }

// ────── app/api/deals/[id]/milestones/[index]/reject/route.js ──────
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(request, { params }) {
  const cookie = request.headers.get("cookie") ?? "";
  const csrfToken = request.headers.get("x-csrf-token") ?? "";
  const { id, index } = await params;
  const body = await request.json();

  const res = await fetch(
    `${BACKEND_URL}/api/deals/${id}/milestones/${index}/reject`,
    {
      method: "POST",
      headers: {
        Cookie: cookie,
        "x-csrf-token": csrfToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  }

  const data = await res.json();
  // Backend returns { success: true, message: "..." }
  // Pass through as-is
  return NextResponse.json(data, { status: 200 });
}
