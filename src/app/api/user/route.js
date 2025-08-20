import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("uid");
    const authHeader = req.headers.get("authorization");

    if (!userId || !authHeader) {
      return new Response(
        JSON.stringify({ message: "Missing userId or Authorization header" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify Firebase ID token
    const idToken = authHeader.replace("Bearer ", "");
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification failed:", error);
      return new Response(
        JSON.stringify({ message: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (decodedToken.uid !== userId) {
      return new Response(JSON.stringify({ message: "Unauthorized user ID" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user data from Firestore
    let userDoc;
    try {
      userDoc = await adminDb.collection("users").doc(userId).get();
    } catch (error) {
      console.error("Firestore user fetch error:", error);
      return new Response(
        JSON.stringify({ message: "Failed to access user data in Firestore" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!userDoc.exists) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userData = userDoc.data();
    return new Response(
      JSON.stringify({
        kycStatus: userData.kycStatus || "pending",
        walletCreated: userData.walletCreated || false,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("User fetch error:", error);
    return new Response(
      JSON.stringify({
        message: error.message || "Failed to fetch user data",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
