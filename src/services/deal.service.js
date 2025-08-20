import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function getDeals() {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");

  const byBuyerId = query(
    collection(db, "deals"),
    where("buyerId", "==", user.uid)
  );
  const bySellerEmail = query(
    collection(db, "deals"),
    where("sellerEmail", "==", user.email)
  );
  const byBuyerEmail = query(
    collection(db, "deals"),
    where("buyerEmail", "==", user.email)
  );

  const [snap1, snap2, snap3] = await Promise.all([
    getDocs(byBuyerId),
    getDocs(bySellerEmail),
    getDocs(byBuyerEmail),
  ]);

  const all = [...snap1.docs, ...snap2.docs, ...snap3.docs].map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const unique = Object.values(
    all.reduce((acc, d) => {
      acc[d.id] = d;
      return acc;
    }, {})
  );

  return unique;
}

export async function createDealFromProposal(proposal) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");
  if (user.email !== proposal.sellerEmail)
    throw new Error("Only the seller can create a deal for this proposal");

  const dealRef = doc(collection(db, "deals"));
  const dealData = {
    proposalId: proposal.id,
    projectTitle: proposal.projectTitle,
    buyerId: proposal.buyerId,
    sellerEmail: proposal.sellerEmail,
    buyerEmail: proposal.buyerEmail,
    totalAmount: Number(proposal.totalAmount) || 0,
    escrowFee: Number(proposal.escrowFee) || 0,
    escrowFeePayer: Number(proposal.escrowFeePayer) || 0,
    milestones:
      proposal.milestones.map((m, index) => ({
        ...m,
        status: index === 0 ? "Funded" : "Pending",
      })) || [],
    status: "Awaiting Funding",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(dealRef, dealData);

  const recipientEmail =
    proposal.creatorRole === "buyer"
      ? proposal.sellerEmail
      : proposal.buyerEmail;
  const res = await fetch("/api/email/deal-created", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientEmail,
      projectTitle: proposal.projectTitle,
      totalAmount: Number(proposal.totalAmount) || 0,
      status: dealData.status,
      dealId: dealRef.id,
    }),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Failed to send deal creation email: ${errorData}`);
  }

  return dealRef.id;
}

export async function completeMilestone(dealId, milestoneIndex) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");

  const dealRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealRef);

  if (!dealSnap.exists()) throw new Error("Deal not found");

  const dealData = dealSnap.data();
  const milestone = dealData.milestones[milestoneIndex];
  if (!milestone) throw new Error("Milestone not found");

  const updatedMilestones = [...dealData.milestones];
  updatedMilestones[milestoneIndex] = { ...milestone, status: "Completed" };

  const nextIndex = milestoneIndex + 1;
  if (nextIndex < dealData.milestones.length) {
    updatedMilestones[nextIndex] = {
      ...dealData.milestones[nextIndex],
      status: "Funded",
    };
  }

  await updateDoc(dealRef, {
    milestones: updatedMilestones,
    status: updatedMilestones.every((m) => m.status === "Completed")
      ? "Completed"
      : dealData.status,
    updatedAt: serverTimestamp(),
  });

  const recipientEmail = dealData.buyerId
    ? dealData.buyerEmail
    : dealData.sellerEmail;

  const res = await fetch("/api/email/milestone-completed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientEmail,
      projectTitle: dealData.projectTitle,
      milestoneTitle: milestone.title,
      milestoneAmount: milestone.amount,
      dealId,
    }),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Failed to send milestone completion email: ${errorData}`);
  }

  return { status: "Milestone completed" };
}

export async function getDealById(dealId) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");

  const dealRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealRef);

  if (!dealSnap.exists()) return null;

  const dealData = dealSnap.data();
  if (
    user.uid === dealData.buyerId ||
    user.email === dealData.sellerEmail ||
    user.email === dealData.buyerEmail
  ) {
    return { id: dealSnap.id, ...dealData };
  }

  return null;
}

export async function fundDeal(dealId, userId, amount, email, displayName) {
  const dealRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealRef);

  if (!dealSnap.exists()) throw new Error("Deal not found");

  const dealData = dealSnap.data();
  if (dealData.status !== "Awaiting Funding") {
    throw new Error("Deal is not in Awaiting Funding status");
  }

  const paymentResponse = await initiatePayment({
    amount,
    email,
    displayName,
    dealId,
  });

  if (paymentResponse.success) {
    const updatedMilestones = dealData.milestones.map((m, index) => ({
      ...m,
      status: index === 0 ? "Funded" : m.status,
    }));

    await updateDoc(dealRef, {
      status: "In Progress",
      milestones: updatedMilestones,
      updatedAt: serverTimestamp(),
    });

    return { success: true, redirect_url: paymentResponse.redirect_url };
  } else {
    throw new Error("Payment initiation failed");
  }
}

async function initiatePayment({ amount, email, displayName, dealId }) {
  return {
    success: true,
    redirect_url: `https://flutterwave.com/pay?tx_ref=${dealId}&amount=${amount}&email=${email}&name=${displayName}`,
  };
}

export async function requestMilestoneRevision(
  dealId,
  milestoneIndex,
  message
) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");

  const dealRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealRef);

  if (!dealSnap.exists()) throw new Error("Deal not found");

  const dealData = dealSnap.data();
  if (user.uid !== dealData.buyerId)
    throw new Error("Only the buyer can request a revision");

  const milestone = dealData.milestones[milestoneIndex];
  if (!milestone) throw new Error("Milestone not found");
  if (milestone.status !== "Submitted for Approval") {
    throw new Error("Milestone is not in Submitted for Approval status");
  }

  const updatedMilestones = [...dealData.milestones];
  updatedMilestones[milestoneIndex] = {
    ...milestone,
    status: "Revision Requested",
    revisionRequest: { message, requestedAt: serverTimestamp() },
  };

  await updateDoc(dealRef, {
    milestones: updatedMilestones,
    updatedAt: serverTimestamp(),
  });

  const res = await fetch("/api/email/milestone-revision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientEmail: dealData.sellerEmail,
      projectTitle: dealData.projectTitle,
      milestoneTitle: milestone.title,
      message,
      dealId,
    }),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Failed to send revision request email: ${errorData}`);
  }

  return { status: "Revision requested" };
}

export async function submitMilestoneWork(
  dealId,
  milestoneIndex,
  message,
  files
) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");

  const dealRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealRef);

  if (!dealSnap.exists()) throw new Error("Deal not found");

  const dealData = dealSnap.data();
  if (user.email !== dealData.sellerEmail)
    throw new Error("Only the seller can submit work");

  const milestone = dealData.milestones[milestoneIndex];
  if (!milestone) throw new Error("Milestone not found");
  if (!["Funded", "Revision Requested"].includes(milestone.status)) {
    throw new Error("Milestone is not in Funded or Revision Requested status");
  }

  let fileData = [];
  if (files && files.length > 0) {
    fileData = await Promise.all(
      files.map(async (file, index) => {
        const storageRef = ref(
          storage,
          `deals/${dealId}/milestones/${milestoneIndex}/${Date.now()}_${index}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return {
          url,
          name: file.name,
          size: file.size,
        };
      })
    );
  }

  const updatedMilestones = [...dealData.milestones];
  updatedMilestones[milestoneIndex] = {
    ...milestone,
    status: "Submitted for Approval",
    submission: {
      message,
      files: fileData,
      submittedAt: serverTimestamp(),
    },
  };

  await updateDoc(dealRef, {
    milestones: updatedMilestones,
    updatedAt: serverTimestamp(),
  });

  const res = await fetch("/api/email/milestone-submitted", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientEmail: dealData.buyerEmail,
      projectTitle: dealData.projectTitle,
      milestoneTitle: milestone.title,
      message,
      dealId,
    }),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Failed to send milestone submission email: ${errorData}`);
  }

  return { status: "Work submitted" };
}

export async function approveAndReleaseMilestone(dealId, milestoneIndex) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");

  const dealRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealRef);

  if (!dealSnap.exists()) throw new Error("Deal not found");

  const dealData = dealSnap.data();
  if (user.uid !== dealData.buyerId)
    throw new Error("Only the buyer can approve milestones");

  const milestone = dealData.milestones[milestoneIndex];
  if (!milestone) throw new Error("Milestone not found");
  if (milestone.status !== "Submitted for Approval") {
    throw new Error("Milestone is not in Submitted for Approval status");
  }

  const updatedMilestones = [...dealData.milestones];
  updatedMilestones[milestoneIndex] = { ...milestone, status: "Completed" };

  const nextIndex = milestoneIndex + 1;
  if (nextIndex < dealData.milestones.length) {
    updatedMilestones[nextIndex] = {
      ...dealData.milestones[nextIndex],
      status: "Funded",
    };
  }

  const allCompleted = updatedMilestones.every((m) => m.status === "Completed");
  const newStatus = allCompleted ? "Completed" : dealData.status;

  await updateDoc(dealRef, {
    milestones: updatedMilestones,
    status: newStatus,
    updatedAt: serverTimestamp(),
  });

  const res = await fetch("/api/email/milestone-completed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientEmail: dealData.sellerEmail,
      projectTitle: dealData.projectTitle,
      milestoneTitle: milestone.title,
      milestoneAmount: milestone.amount,
      dealId,
    }),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Failed to send milestone completion email: ${errorData}`);
  }

  return { status: "Milestone approved and released" };
}
