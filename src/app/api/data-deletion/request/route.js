// app/api/data-deletion/request/route.js
import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request) {
  try {
    const body = await request.json();

    // ✅ Your backend looks for "jwt" cookie, not "token"
    const token = request.cookies.get("jwt")?.value;

    console.log("🔍 API Route Debug:");
    console.log("- Has JWT token:", !!token);
    console.log(
      "- Token preview:",
      token ? token.substring(0, 20) + "..." : "none",
    );

    if (!token) {
      console.error("❌ No JWT token found in cookies!");
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const headers = {
      "Content-Type": "application/json",
      // ✅ Send the JWT cookie to backend
      Cookie: `jwt=${token}`,
    };

    console.log(
      "📤 Sending request to:",
      `${BACKEND}/api/data-deletion/request`,
    );

    const res = await fetch(`${BACKEND}/api/data-deletion/request`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    console.log("📥 Backend response status:", res.status);

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Backend error:", data);
    } else {
      console.log("✅ Success:", data);
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("💥 API Route error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit deletion request" },
      { status: 500 },
    );
  }
}
