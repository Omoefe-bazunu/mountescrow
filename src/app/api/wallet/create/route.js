import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { createFcmbWallet } from "@/lib/fcmb";

export async function POST(req) {
  try {
    // Check for Firebase Auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          message: "Authorization header with Bearer token required",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract and verify Firebase ID token
    const idToken = authHeader.split("Bearer ")[1];
    if (!idToken) {
      return new Response(
        JSON.stringify({ message: "Invalid or missing Bearer token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { userId, firstname, lastname, phone, dob, bvn } = await req.json();

    // Validate fields
    if (!userId || !firstname || !lastname || !phone || !dob || !bvn) {
      return new Response(
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate input formats
    if (!/^\d{11}$/.test(bvn)) {
      return new Response(
        JSON.stringify({ message: "BVN must be 11 digits" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return new Response(
        JSON.stringify({ message: "DOB must be in YYYY-MM-DD format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!/^\+?\d{10,13}$/.test(phone)) {
      return new Response(
        JSON.stringify({ message: "Phone number must be 10-13 digits" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ensure the UID from token matches the provided userId
    if (decodedToken.uid !== userId) {
      return new Response(JSON.stringify({ message: "Unauthorized user ID" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check KYC status in users collection
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists || userDoc.data().kycStatus !== "approved") {
      return new Response(
        JSON.stringify({ message: "KYC approval required to create wallet" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if wallet already exists
    const walletDoc = await adminDb.collection("wallets").doc(userId).get();
    if (walletDoc.exists) {
      return new Response(
        JSON.stringify({ message: "Wallet already exists for this user" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create wallet via FCMB API
    const wallet = await createFcmbWallet(userId, {
      firstname,
      lastname,
      phone,
      dob,
      bvn,
    });

    // Update user document to mark wallet as created
    await adminDb.collection("users").doc(userId).set(
      {
        walletCreated: true,
        accountNumber: wallet.accountNumber,
        bankName: wallet.bankName,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return new Response(JSON.stringify(wallet), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Wallet creation error:", error);
    if (error.code === "auth/id-token-expired") {
      return new Response(
        JSON.stringify({
          message: "Token expired. Please refresh your authentication.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        message: error.message || "Failed to create wallet",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
