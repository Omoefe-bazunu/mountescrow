import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { fundNextMilestone } from "@/services/deal.service";
import crypto from "crypto";

const FLUTTERWAVE_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH;
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!FLUTTERWAVE_SECRET_HASH) {
    console.error("FLUTTERWAVE_SECRET_HASH not configured");
    return false;
  }

  const hash = crypto
    .createHmac("sha256", FLUTTERWAVE_SECRET_HASH)
    .update(payload, "utf8")
    .digest("hex");

  return hash === signature;
}

// Verify transaction with Flutterwave
async function verifyTransaction(transactionId: string) {
  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error("FLUTTERWAVE_SECRET_KEY not configured");
  }

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to verify transaction: ${response.statusText}`);
  }

  return await response.json();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const signature = req.headers["verif-hash"] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error("Invalid webhook signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const { event, data } = req.body;

    console.log("Flutterwave webhook received:", {
      event,
      transactionId: data?.id,
    });

    // Log the webhook event
    await addDoc(collection(db, "logs"), {
      timestamp: serverTimestamp(),
      level: "INFO",
      service: "FLUTTERWAVE_WEBHOOK",
      message: `Webhook received: ${event}`,
      data: { event, transactionId: data?.id, status: data?.status },
    });

    switch (event) {
      case "charge.completed":
        await handleChargeCompleted(data);
        break;

      case "transfer.completed":
        await handleTransferCompleted(data);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing Flutterwave webhook:", error);

    // Log the error
    await addDoc(collection(db, "logs"), {
      timestamp: serverTimestamp(),
      level: "ERROR",
      service: "FLUTTERWAVE_WEBHOOK",
      message: "Webhook processing failed",
      error: (error as Error).message,
    });

    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleChargeCompleted(data: any) {
  const { id: transactionId, status, tx_ref, meta } = data;

  if (status !== "successful") {
    console.log(`Charge not successful: ${status}`);
    return;
  }

  // Verify the transaction
  const verification = await verifyTransaction(transactionId);

  if (
    verification.status !== "success" ||
    verification.data.status !== "successful"
  ) {
    console.error("Transaction verification failed:", verification);
    return;
  }

  // Extract deal information from meta or tx_ref
  const dealId = meta?.dealId || tx_ref?.split("-")[1]; // Assuming tx_ref format: ESCROW-{dealId}-{buyerId}-{timestamp}
  const buyerId = meta?.buyerId || tx_ref?.split("-")[2];

  if (!dealId || !buyerId) {
    console.error("Missing deal information in transaction:", {
      dealId,
      buyerId,
      tx_ref,
      meta,
    });
    return;
  }

  try {
    // Get the deal from Firestore
    const dealDocRef = doc(db, "deals", dealId);
    const dealSnap = await getDoc(dealDocRef);

    if (!dealSnap.exists()) {
      console.error("Deal not found for payment:", dealId);
      return;
    }

    const dealData = dealSnap.data();

    // Check if deal is already funded to prevent double processing
    if (dealData.status === "Awaiting Funding") {
      // Update deal status to "In Progress"
      await updateDoc(dealDocRef, {
        status: "In Progress",
        updatedAt: serverTimestamp(),
      });

      // Fund the first milestone
      await fundNextMilestone(dealId, -1);

      console.log(
        `Deal ${dealId} funded and updated successfully via webhook.`
      );
    } else {
      console.warn(
        `Deal ${dealId} already funded or in unexpected status: ${dealData.status}`
      );
    }
  } catch (error) {
    console.error("Error processing charge completion:", error);
    throw error;
  }
}

async function handleTransferCompleted(data: any) {
  const { id: transferId, status, reference, meta } = data;

  console.log("Transfer completed:", { transferId, status, reference });

  // Update transaction status in database
  try {
    // Find the transaction by service reference
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("serviceRef", "==", reference)
    );

    const transactionSnapshot = await getDocs(transactionsQuery);

    if (!transactionSnapshot.empty) {
      const transactionDoc = transactionSnapshot.docs[0];
      await updateDoc(transactionDoc.ref, {
        status: status === "SUCCESSFUL" ? "SUCCESS" : "FAILED",
        updatedAt: serverTimestamp(),
      });

      // If this was a milestone payment and it was successful, update the milestone status
      const transactionData = transactionDoc.data();
      if (
        transactionData.type === "MILESTONE_PAYMENT" &&
        status === "SUCCESSFUL"
      ) {
        const dealId = transactionData.dealId;
        const milestoneTitle = meta?.milestoneTitle;

        if (dealId && milestoneTitle) {
          // Find and update the milestone status to "Completed"
          const dealDocRef = doc(db, "deals", dealId);
          const dealSnap = await getDoc(dealDocRef);

          if (dealSnap.exists()) {
            const dealData = dealSnap.data();
            const milestones = [...dealData.milestones];

            // Find the milestone by title and update its status
            const milestoneIndex = milestones.findIndex(
              (m) => m.title === milestoneTitle
            );
            if (milestoneIndex !== -1) {
              milestones[milestoneIndex].status = "Completed";

              await updateDoc(dealDocRef, {
                milestones,
                updatedAt: serverTimestamp(),
              });

              // Fund next milestone or complete deal
              await fundNextMilestone(dealId, milestoneIndex);

              console.log(
                `Milestone "${milestoneTitle}" marked as completed for deal ${dealId}`
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error updating transfer status:", error);
    throw error;
  }
}
