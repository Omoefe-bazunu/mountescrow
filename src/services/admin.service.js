"use server";

import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { Resend } from "resend";
import { refreshFcmbWalletBalance } from "@/lib/fcmb";

const resend = new Resend(process.env.RESEND_API_KEY);

const walletAdjustmentTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #f8f8f8; padding: 10px; text-align: center; }
      .content { padding: 20px; }
      .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Mountescrow</h1>
      </div>
      <div class="content">
        <h2>Wallet {{type}}</h2>
        <p>Hello {{recipientName}},</p>
        <p>Your wallet has been {{type}} by ₦{{amount}}.</p>
        <p><strong>Reason:</strong> {{reason}}</p>
        <p><strong>New Balance:</strong> ₦{{new_balance}}</p>
        <p>View your wallet details:</p>
        <a href="{{walletLink}}" class="button">View Wallet</a>
      </div>
    </div>
  </body>
  </html>
`;

const disputeResolvedTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #f8f8f8; padding: 10px; text-align: center; }
      .content { padding: 20px; }
      .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Mountescrow</h1>
      </div>
      <div class="content">
        <h2>Dispute Resolved</h2>
        <p>Hello {{recipientName}},</p>
        <p>The dispute for "{{subject}}" has been resolved.</p>
        <p><strong>Notes:</strong> {{notes}}</p>
        <p><strong>Amount:</strong> {{amount}}</p>
        <p>View the dispute details:</p>
        <a href="{{disputeLink}}" class="button">View Dispute</a>
      </div>
    </div>
  </body>
  </html>
`;

export async function adjustUserWallet(adjustment) {
  const { userId, amount, type, reason, adminId, adminEmail } = adjustment;

  const walletRef = doc(db, "userWallets", userId);
  const walletDoc = await getDoc(walletRef);

  if (!walletDoc.exists()) throw new Error("Wallet not found");
  const currentBalance = walletDoc.data()?.balance || 0;
  const adjustmentAmount = type === "credit" ? amount : -amount;
  const newBalance = currentBalance + adjustmentAmount;

  if (newBalance < 0) throw new Error("Insufficient balance");

  try {
    // Update balance in Firestore
    await updateDoc(walletRef, {
      balance: newBalance,
      updatedAt: serverTimestamp(),
    });

    // Log transaction
    await addDoc(collection(db, "transactions"), {
      userId,
      type: type.toUpperCase(),
      amount: Math.abs(amount),
      status: "SUCCESS",
      description: `Admin adjustment: ${reason}`,
      createdAt: serverTimestamp(),
      service: "ADMIN",
      adminId,
      adminEmail,
    });

    // Send email
    const userDoc = await getDoc(doc(db, "users", userId));
    const userData = userDoc.data();
    if (userData?.email) {
      const html = walletAdjustmentTemplate
        .replace("{{recipientName}}", userData.displayName || userData.email)
        .replace("{{type}}", type === "credit" ? "Credited" : "Debited")
        .replace("{{amount}}", amount.toFixed(2))
        .replace("{{reason}}", reason)
        .replace("{{new_balance}}", newBalance.toFixed(2))
        .replace("{{walletLink}}", "https://www.mountescrow.com/wallet");

      await resend.emails.send({
        from: "Mountescrow <no-reply@penned-aae02.com>",
        to: [userData.email],
        subject: `Wallet ${type === "credit" ? "Credit" : "Debit"} - Mountescrow`,
        html,
        headers: { "X-Entity-Ref-ID": userId },
        tags: [{ name: "category", value: `wallet_${type}` }],
      });
    }

    // Log admin action
    await addDoc(collection(db, "logs"), {
      timestamp: serverTimestamp(),
      level: "INFO",
      service: "ADMIN",
      message: `Wallet adjustment performed`,
      userId,
      adminId,
      adminEmail,
      type,
      amount,
      reason,
      newBalance,
    });
  } catch (error) {
    console.error("Adjust wallet error:", error);
    throw new Error("Failed to adjust wallet");
  }
}

export async function resolveDispute(disputeId, resolution) {
  const disputeRef = doc(db, "disputes", disputeId);
  const disputeDoc = await getDoc(disputeRef);

  if (!disputeDoc.exists()) throw new Error("Dispute not found");
  const disputeData = disputeDoc.data();

  try {
    // Update dispute status
    await updateDoc(disputeRef, {
      status: "resolved",
      resolution: { ...resolution, resolvedAt: serverTimestamp() },
      updatedAt: serverTimestamp(),
    });

    // Adjust wallet if needed
    if (resolution.resolutionType !== "no_action" && resolution.amount) {
      const userId =
        resolution.resolutionType === "refund_buyer"
          ? disputeData.buyerId
          : disputeData.sellerId;
      const walletRef = doc(db, "userWallets", userId);
      const walletDoc = await getDoc(walletRef);

      if (!walletDoc.exists()) throw new Error("Wallet not found");
      const currentBalance = walletDoc.data()?.balance || 0;
      const newBalance = currentBalance + resolution.amount;

      await updateDoc(walletRef, {
        balance: newBalance,
        updatedAt: serverTimestamp(),
      });

      // Log transaction
      await addDoc(collection(db, "transactions"), {
        userId,
        type: "CREDIT",
        amount: resolution.amount,
        status: "SUCCESS",
        description: `Dispute resolution: ${resolution.notes}`,
        createdAt: serverTimestamp(),
        service: "DISPUTE",
        adminId: resolution.adminId,
        adminEmail: resolution.adminEmail,
      });
    }

    // Send emails to both parties
    const html = disputeResolvedTemplate
      .replace("{{recipientName}}", disputeData.buyerEmail)
      .replace("{{subject}}", disputeData.projectTitle)
      .replace("{{notes}}", resolution.notes)
      .replace(
        "{{amount}}",
        resolution.amount ? `₦${resolution.amount.toFixed(2)}` : "N/A"
      )
      .replace(
        "{{disputeLink}}",
        `https://www.mountescrow.com/disputes/${disputeId}`
      );

    await resend.emails.send({
      from: "Mountescrow <no-reply@penned-aae02.com>",
      to: [disputeData.buyerEmail],
      subject: `Dispute Resolved - ${disputeData.projectTitle}`,
      html,
      headers: { "X-Entity-Ref-ID": disputeId },
      tags: [{ name: "category", value: "dispute_resolved" }],
    });

    await resend.emails.send({
      from: "Mountescrow <no-reply@penned-aae02.com>",
      to: [disputeData.sellerEmail],
      subject: `Dispute Resolved - ${disputeData.projectTitle}`,
      html,
      headers: { "X-Entity-Ref-ID": disputeId },
      tags: [{ name: "category", value: "dispute_resolved" }],
    });

    // Log admin action
    await addDoc(collection(db, "logs"), {
      timestamp: serverTimestamp(),
      level: "INFO",
      service: "ADMIN",
      message: `Dispute resolved with ${resolution.resolutionType}`,
      disputeId,
      adminId: resolution.adminId,
      adminEmail: resolution.adminEmail,
      resolutionType: resolution.resolutionType,
      amount: resolution.amount || 0,
    });
  } catch (error) {
    console.error("Resolve dispute error:", error);
    throw new Error("Failed to resolve dispute");
  }
}
