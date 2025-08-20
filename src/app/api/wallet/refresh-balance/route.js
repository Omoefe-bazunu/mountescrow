import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { refreshFcmbWalletBalance } from "@/lib/fcmb";
import { doc, getDoc } from "firebase/firestore";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("uid");
    const authHeader = req.headers.get("authorization");

    if (!userId || !authHeader) {
      return Response.json(
        { message: "Missing userId or Authorization header" },
        { status: 400 }
      );
    }

    // Verify Firebase ID token
    const idToken = authHeader.replace("Bearer ", "");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.uid !== userId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user data from Firestore using admin SDK
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists || !userDoc.data().accountNumber) {
      return Response.json({ message: "Wallet not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const accountNumber = userData.accountNumber;
    const balance = await refreshFcmbWalletBalance(userId, accountNumber);

    return Response.json({
      accountNumber,
      bankName: userData.bankName,
      balance,
    });
  } catch (error) {
    console.error("refreshWalletBalance error:", error.message);
    return Response.json(
      { message: error.message || "Failed to refresh balance" },
      { status: 500 }
    );
  }
}
