// //For updating proposal status to accepted or rejected

// import { NextResponse } from "next/server";

// const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// export async function PATCH(request, { params }) {
//   const body = await request.text();
//   const cookie = request.headers.get("cookie") ?? "";
//   const csrfToken = request.headers.get("x-csrf-token") ?? "";
//   const { id } = await params;

//   const res = await fetch(`${BACKEND_URL}/api/proposals/${id}/status`, {
//     method: "PATCH",
//     headers: {
//       "Content-Type": "application/json",
//       Cookie: cookie,
//       "x-csrf-token": csrfToken,
//     },
//     body,
//     credentials: "include",
//   });

//   const data = await res.text();
//   return new NextResponse(data, { status: res.status });
// }

// ────── app/api/proposals/[id]/status/route.js ──────
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function PATCH(request, { params }) {
  const body = await request.text();
  const cookie = request.headers.get("cookie") ?? "";
  const csrfToken = request.headers.get("x-csrf-token") ?? "";
  const { id } = await params;

  const res = await fetch(`${BACKEND_URL}/api/proposals/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      "x-csrf-token": csrfToken,
    },
    body,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  }

  const data = await res.json();
  // Backend returns { success: true }
  // Pass through as-is
  return NextResponse.json(data, { status: res.status });
}
