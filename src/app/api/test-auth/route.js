// API route to test authentication
import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-utils";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const user = await verifyAuthToken(authHeader);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Authenticated successfully",
      user: { uid: user.uid, email: user.email },
    });
  } catch (error) {
    console.error("Auth test error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
