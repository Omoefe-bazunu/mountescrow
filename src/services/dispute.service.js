import { db, auth } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

export async function createDispute(dealId, reason) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");

  const dealRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealRef);

  if (!dealSnap.exists()) throw new Error("Deal not found");

  const dealData = dealSnap.data();
  const disputeRef = doc(collection(db, "disputes"));
  const disputeData = {
    dealId,
    projectTitle: dealData.projectTitle,
    reason,
    buyerId: dealData.buyerId,
    sellerEmail: dealData.sellerEmail,
    buyerEmail: dealData.buyerEmail,
    disputedBy: user.uid,
    creatorEmail: user.email,
    status: "open",
    priority: "medium",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(disputeRef, disputeData);

  const recipientEmail =
    dealData.buyerEmail === user.email
      ? dealData.sellerEmail
      : dealData.buyerEmail;
  const recipientName = recipientEmail.split("@")[0];

  const res = await fetch("/api/email/dispute-created", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientEmail,
      recipientName,
      projectTitle: dealData.projectTitle,
      reason,
      dealId,
      disputeId: disputeRef.id,
    }),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Failed to send dispute email: ${errorData}`);
  }

  return disputeRef.id;
}

export async function getDisputes() {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");

  const byDisputedBy = query(
    collection(db, "disputes"),
    where("disputedBy", "==", user.uid)
  );
  const byBuyerId = query(
    collection(db, "disputes"),
    where("buyerId", "==", user.uid)
  );
  const bySellerEmail = query(
    collection(db, "disputes"),
    where("sellerEmail", "==", user.email)
  );
  const byBuyerEmail = query(
    collection(db, "disputes"),
    where("buyerEmail", "==", user.email)
  );

  const [snap1, snap2, snap3, snap4] = await Promise.all([
    getDocs(byDisputedBy),
    getDocs(byBuyerId),
    getDocs(bySellerEmail),
    getDocs(byBuyerEmail),
  ]);

  const allDisputes = [
    ...snap1.docs,
    ...snap2.docs,
    ...snap3.docs,
    ...snap4.docs,
  ].map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const uniqueDisputes = Object.values(
    allDisputes.reduce((acc, dispute) => {
      acc[dispute.id] = dispute;
      return acc;
    }, {})
  );

  return uniqueDisputes;
}
