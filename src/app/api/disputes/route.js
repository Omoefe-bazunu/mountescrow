import { NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  const cookie = request.headers.get("cookie") ?? "";
  const csrfToken = request.headers.get("x-csrf-token") ?? "";
  const formData = await request.formData();

  const res = await fetch(`${BACKEND}/api/disputes`, {
    method: "POST",
    headers: { Cookie: cookie, "X-CSRF-Token": csrfToken },
    credentials: "include",
    body: formData,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
