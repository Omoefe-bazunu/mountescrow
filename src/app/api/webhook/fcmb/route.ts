import { NextRequest, NextResponse } from "next/server";

// Force this route to use Node.js runtime instead of Edge Runtime
export const runtime = "nodejs";

import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendEmail } from "@/services/email.service";

// Basic logging function to Firestore
async function logEvent(
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  data: any = {}
) {
  try {
    await db.collection("logs").add({
      timestamp: FieldValue.serverTimestamp(),
      level,
      message,
      ...data,
    });
  } catch (error) {
    console.error("Failed to write to log:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    await logEvent("INFO", "Received FCMB Webhook", {
      event: payload.event,
      payload,
    });

    // Basic validation
    if (payload.event !== "wallet.credit") {
      await logEvent("INFO", "Ignoring irrelevant event type", {
        event: payload.event,
      });
      return NextResponse.json({
        status: "ignored",
        message: "Event type not handled",
      });
    }

    const { walletAccountId, amount, transactionReference } = payload.data;

    if (!walletAccountId || !amount) {
      await logEvent("WARN", "Webhook payload missing data", { payload });
      return NextResponse.json(
        { status: "error", message: "Missing walletAccountId or amount" },
        { status: 400 }
      );
    }

    // Find user by walletAccountId
    const walletsRef = db.collection("userWallets");
    const q = walletsRef.where("walletAccountId", "==", walletAccountId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      await logEvent("WARN", "No user wallet found for walletAccountId", {
        walletAccountId,
      });
      return NextResponse.json({
        status: "not_found",
        message: "Wallet not found",
      });
    }

    const userWalletDoc = querySnapshot.docs[0];
    const userId = userWalletDoc.id;
    const userData = (await db.collection("users").doc(userId).get()).data();

    // Update user's balance in Firestore
    await userWalletDoc.ref.update({
      balance: FieldValue.increment(amount),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Log the transaction for audit purposes
    const transactionLog = {
      userId: userId,
      type: "DEPOSIT",
      amount: amount,
      status: "SUCCESS",
      description: `Wallet deposit via virtual account. Ref: ${transactionReference}`,
      createdAt: FieldValue.serverTimestamp(),
      service: "FCMB",
      serviceRef: transactionReference,
    };
    await db.collection("transactions").add(transactionLog);

    await logEvent("INFO", "Successfully credited wallet", { userId, amount });

    // Send email confirmation
    if (userData?.email) {
      await sendEmail({
        to_email: userData.email,
        to_name: userData.displayName || "User",
        subject: "Your Mountescrow Wallet has been Credited",
        message: `Your wallet has been successfully credited with $${amount.toFixed(
          2
        )}. Your new balance is available for use.`,
      }).catch((e) =>
        logEvent("ERROR", "Failed to send deposit confirmation email", {
          userId,
          error: e.message,
        })
      );
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Error processing FCMB webhook:", error);
    await logEvent("ERROR", "Error processing FCMB webhook", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { status: "error", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
