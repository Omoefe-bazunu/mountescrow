// app/api/webhook/fcmb-deposit/route.js
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  try {
    // Parse the JSON body
    const body = await request.json();

    console.log("🔔 Forwarding FCMB webhook to backend...");

    const res = await fetch(`${BACKEND_URL}/api/webhook/fcmb-deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // Always return 200 to FCMB to prevent retries
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Webhook proxy error:", error);
    // Always return 200 to FCMB even on proxy errors
    return NextResponse.json(
      {
        success: false,
        error: "Proxy error but acknowledged",
      },
      { status: 200 }
    );
  }
}
