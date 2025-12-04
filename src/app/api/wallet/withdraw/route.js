import { NextResponse } from "next/server";

// Ensure this environment variable is correctly set to your backend server URL
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  const body = await request.json();

  // 1. Capture the Cookie header (needed for session/auth)
  const cookie = request.headers.get("cookie") ?? "";

  // 2. >>> NEW: Capture the X-CSRF-TOKEN header sent by the frontend <<<
  const csrfToken = request.headers.get("x-csrf-token");

  // Create headers object for the backend request
  const headers = {
    "Content-Type": "application/json",
    // Forward the cookie for session management
    Cookie: cookie,
  };

  // 3. >>> NEW: Conditionally add the X-CSRF-TOKEN header to the backend request <<<
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  // Forward the request to the actual backend API
  const res = await fetch(`${BACKEND_URL}/api/wallet/withdraw`, {
    method: "POST",
    headers: headers, // Use the new headers object
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const response = NextResponse.json(data, { status: res.status });

  // Forward any set-cookie headers (e.g., if the session is refreshed)
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);

  return response;
}
