import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  or,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type { ProposalData } from "./proposal.service";
import {
  releaseFromEscrow,
  transferToEscrow,
  getUserWallet,
} from "./fcmb.service";
import { sendEmail } from "./email.service";
import { uploadMultipleFiles, UploadedFile } from "./storage.service";
import { validateEnvironmentVariables } from "@/lib/config";

export interface Milestone {
  title: string;
  amount: number;
  description: string;
  dueDate: any;
  status:
    | "Pending"
    | "Funded"
    | "Submitted for Approval"
    | "Revision Requested"
    | "Completed";
  files?: any[];
  submission?: {
    message: string;
    files: UploadedFile[];
    submittedAt: any;
  };
  revisionRequest?: {
    message: string;
    requestedAt: any;
  };
}

export interface DealData
  extends Omit<
    ProposalData,
    "status" | "createdAt" | "updatedAt" | "milestones"
  > {
  status: "Awaiting Funding" | "In Progress" | "Completed" | "In Dispute";
  proposalId: string;
  createdAt: any;
  updatedAt: any;
  milestones: Milestone[];
}

async function checkUserPermissions(): Promise<string> {
  // Validate environment variables first
  try {
    validateEnvironmentVariables();
  } catch (error) {
    throw new Error(`System configuration error: ${(error as Error).message}`);
  }

  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");
  if (!user.emailVerified)
    throw new Error("Email not verified. Please verify your email to proceed.");

  return user.uid;
}

export async function createDealFromProposal(
  proposal: { id: string } & Omit<ProposalData, "id">
): Promise<string> {
  await checkUserPermissions();

  // Validate proposal data
  if (!proposal.id?.trim()) {
    throw new Error("Proposal ID is required");
  }
  if (proposal.status !== "Accepted") {
    throw new Error("Only accepted proposals can be converted to deals");
  }
  if (!proposal.milestones || proposal.milestones.length === 0) {
    throw new Error("Proposal must have at least one milestone");
  }

  try {
    const initialMilestones: Milestone[] = proposal.milestones.map((m) => ({
      ...m,
      status: "Pending",
    }));

    const dealData: Omit<DealData, "id" | "createdAt" | "updatedAt"> = {
      ...proposal,
      proposalId: proposal.id,
      status: "Awaiting Funding",
      milestones: initialMilestones,
    };

    const docRef = await addDoc(collection(db, "deals"), {
      ...dealData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Send notification email (non-blocking)
    if (proposal.buyerEmail) {
      try {
        await sendEmail({
          to_email: proposal.buyerEmail,
          to_name: "Buyer",
          subject: "Action Required: Fund Your New Deal",
          message: `Your proposal "${proposal.projectTitle}" was accepted! Please proceed to your dashboard to fund the escrow and get the project started.`,
          deal_title: proposal.projectTitle,
          deal_url: `https://www.mountescrow.com/deals/${docRef.id}`,
        });
      } catch (emailError) {
        console.error(
          "Failed to send deal creation notification email:",
          emailError
        );
      }
    }

    return docRef.id;
  } catch (error) {
    console.error("Error creating deal from proposal:", error);
    throw error;
  }
}

export async function getDeals(): Promise<({ id: string } & DealData)[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const dealsCol = collection(db, "deals");
  const q = query(
    dealsCol,
    or(where("buyerId", "==", user.uid), where("sellerEmail", "==", user.email))
  );

  const querySnapshot = await getDocs(q);

  const deals: ({ id: string } & DealData)[] = [];
  querySnapshot.forEach((doc) => {
    deals.push({ id: doc.id, ...(doc.data() as DealData) });
  });

  deals.sort(
    (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
  );
  return deals;
}

export async function getDealById(
  id: string
): Promise<({ id: string } & DealData) | null> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const dealDoc = doc(db, "deals", id);
  const docSnap = await getDoc(dealDoc);

  if (docSnap.exists()) {
    const dealData = docSnap.data() as DealData;
    if (dealData.buyerId === user.uid || dealData.sellerEmail === user.email) {
      return { id: docSnap.id, ...dealData };
    } else {
      console.error("User not authorized to view this deal.");
      return null;
    }
  } else {
    console.log("No such document!");
    return null;
  }
}

export async function fundDeal(
  dealId: string,
  buyerId: string,
  amount: number
) {
  if (!dealId?.trim()) {
    throw new Error("Deal ID is required");
  }
  if (!buyerId?.trim()) {
    throw new Error("Buyer ID is required");
  }
  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  await checkUserPermissions();

  // Verify KYC status for funding
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");
  const wallet = await getUserWallet(user.uid);
  if (wallet?.kycStatus !== "approved") {
    throw new Error(
      "KYC not approved. Please complete KYC verification to fund the deal."
    );
  }

  // Verify deal exists and is in correct status
  const dealDoc = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealDoc);

  if (!dealSnap.exists()) {
    throw new Error("Deal not found");
  }

  const dealData = dealSnap.data() as DealData;

  if (dealData.status !== "Awaiting Funding") {
    throw new Error(`Cannot fund deal. Current status: ${dealData.status}`);
  }

  if (dealData.buyerId !== buyerId) {
    throw new Error("Only the buyer can fund this deal");
  }

  // Verify amount matches expected total
  const expectedAmount = dealData.totalAmount + dealData.escrowFee;
  if (Math.abs(amount - expectedAmount) > 0.01) {
    throw new Error(
      `Amount mismatch. Expected: $${expectedAmount.toFixed(
        2
      )}, Provided: $${amount.toFixed(2)}`
    );
  }

  // Transfer funds to escrow
  await transferToEscrow(buyerId, dealId, amount);

  // Update deal status
  await updateDoc(dealDoc, {
    status: "In Progress",
    updatedAt: serverTimestamp(),
  });

  // Fund first milestone
  await fundNextMilestone(dealId, -1);

  // Send notification email (non-blocking)
  try {
    await sendEmail({
      to_email: dealData.sellerEmail,
      to_name: "Seller",
      subject: "Deal Funded! You Can Start Work",
      message: `The deal "${dealData.projectTitle}" has been funded by the buyer. You can now begin work on the first milestone.`,
      deal_title: dealData.projectTitle,
      deal_url: `https://www.mountescrow.com/deals/${dealId}`,
    });
  } catch (emailError) {
    console.error(
      "Failed to send deal funding notification email:",
      emailError
    );
  }
}

export async function approveAndReleaseMilestone(
  dealId: string,
  milestoneIndex: number
) {
  if (!dealId?.trim()) {
    throw new Error("Deal ID is required");
  }
  if (typeof milestoneIndex !== "number" || milestoneIndex < 0) {
    throw new Error("Valid milestone index is required");
  }

  const userId = await checkUserPermissions();
  const dealDocRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealDocRef);

  if (!dealSnap.exists()) throw new Error("Deal not found");

  const dealData = dealSnap.data() as DealData;
  const milestone = dealData.milestones[milestoneIndex];

  if (!milestone) throw new Error("Milestone not found");
  if (dealData.buyerId !== userId)
    throw new Error("Only the buyer can approve milestones.");
  if (milestone.status !== "Submitted for Approval") {
    throw new Error(
      `Cannot approve milestone. Current status: ${milestone.status}`
    );
  }

  // Find seller's user ID
  const sellerUserQuery = await getDocs(
    query(collection(db, "users"), where("email", "==", dealData.sellerEmail))
  );
  if (sellerUserQuery.empty) throw new Error("Seller user account not found.");
  const sellerId = sellerUserQuery.docs[0].id;

  // Release payment to seller
  await releaseFromEscrow(sellerId, dealId, milestone.title, milestone.amount);

  // Update milestone status
  const milestones = [...dealData.milestones];
  milestones[milestoneIndex].status = "Completed";
  await updateDoc(dealDocRef, { milestones, updatedAt: serverTimestamp() });

  // Fund next milestone or complete deal
  await fundNextMilestone(dealId, milestoneIndex);
}

export async function fundNextMilestone(
  dealId: string,
  completedMilestoneIndex: number
) {
  if (!dealId?.trim()) {
    throw new Error("Deal ID is required");
  }

  const dealDocRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealDocRef);
  if (!dealSnap.exists()) throw new Error("Deal not found");

  const dealData = dealSnap.data() as DealData;
  const milestones = [...dealData.milestones];
  const nextMilestoneIndex = completedMilestoneIndex + 1;

  if (nextMilestoneIndex < milestones.length) {
    milestones[nextMilestoneIndex].status = "Funded";
    await updateDoc(dealDocRef, { milestones, updatedAt: serverTimestamp() });
  } else {
    // All milestones completed
    await updateDoc(dealDocRef, {
      status: "Completed",
      updatedAt: serverTimestamp(),
    });

    // Send completion notifications (non-blocking)
    try {
      if (dealData.buyerEmail) {
        await sendEmail({
          to_email: dealData.buyerEmail,
          to_name: "Buyer",
          subject: `Deal Completed: ${dealData.projectTitle}`,
          message: `Congratulations! The deal "${dealData.projectTitle}" has been successfully completed.`,
          deal_title: dealData.projectTitle,
          deal_url: `https://www.mountescrow.com/deals/${dealId}`,
        });
      }
      await sendEmail({
        to_email: dealData.sellerEmail,
        to_name: "Seller",
        subject: `Deal Completed: ${dealData.projectTitle}`,
        message: `Congratulations! The deal "${dealData.projectTitle}" has been successfully completed.`,
        deal_title: dealData.projectTitle,
        deal_url: `https://www.mountescrow.com/deals/${dealId}`,
      });
    } catch (emailError) {
      console.error(
        "Failed to send deal completion notification emails:",
        emailError
      );
    }
  }
}

export async function submitMilestoneWork(
  dealId: string,
  milestoneIndex: number,
  message: string,
  files: FileList | null
) {
  if (!dealId?.trim()) {
    throw new Error("Deal ID is required");
  }
  if (typeof milestoneIndex !== "number" || milestoneIndex < 0) {
    throw new Error("Valid milestone index is required");
  }
  if (!message?.trim()) {
    throw new Error("Submission message is required");
  }

  await checkUserPermissions();
  const dealDocRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealDocRef);
  if (!dealSnap.exists()) throw new Error("Deal not found");

  const dealData = dealSnap.data() as DealData;
  const milestones = [...dealData.milestones];

  if (!milestones[milestoneIndex]) {
    throw new Error("Milestone not found");
  }

  if (
    !["Funded", "Revision Requested"].includes(
      milestones[milestoneIndex].status
    )
  ) {
    throw new Error(
      `Cannot submit work. Milestone status: ${milestones[milestoneIndex].status}`
    );
  }

  // Upload files if any
  let uploadedFiles: UploadedFile[] = [];
  if (files && files.length > 0) {
    try {
      uploadedFiles = await uploadMultipleFiles(dealId, milestoneIndex, files);
    } catch (error) {
      throw new Error(`File upload failed: ${(error as Error).message}`);
    }
  }

  // Update milestone with submission
  milestones[milestoneIndex].status = "Submitted for Approval";
  milestones[milestoneIndex].submission = {
    message: message.trim(),
    files: uploadedFiles,
    submittedAt: serverTimestamp(),
  };
  delete milestones[milestoneIndex].revisionRequest;

  await updateDoc(dealDocRef, { milestones, updatedAt: serverTimestamp() });

  // Send notification email (non-blocking)
  if (dealData.buyerEmail) {
    try {
      await sendEmail({
        to_email: dealData.buyerEmail,
        to_name: "Buyer",
        subject: `Milestone Submitted for: ${dealData.projectTitle}`,
        message: `The seller has submitted work for milestone "${milestones[milestoneIndex].title}". Please review and approve it.`,
        deal_title: dealData.projectTitle,
        deal_url: `https://www.mountescrow.com/deals/${dealId}`,
      });
    } catch (emailError) {
      console.error(
        "Failed to send milestone submission notification email:",
        emailError
      );
    }
  }
}

export async function requestMilestoneRevision(
  dealId: string,
  milestoneIndex: number,
  message: string
) {
  if (!dealId?.trim()) {
    throw new Error("Deal ID is required");
  }
  if (typeof milestoneIndex !== "number" || milestoneIndex < 0) {
    throw new Error("Valid milestone index is required");
  }
  if (!message?.trim()) {
    throw new Error("Revision message is required");
  }

  await checkUserPermissions();
  const dealDocRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealDocRef);
  if (!dealSnap.exists()) throw new Error("Deal not found");

  const dealData = dealSnap.data() as DealData;
  const milestones = [...dealData.milestones];

  if (!milestones[milestoneIndex]) {
    throw new Error("Milestone not found");
  }

  if (milestones[milestoneIndex].status !== "Submitted for Approval") {
    throw new Error(
      `Cannot request revision. Milestone status: ${milestones[milestoneIndex].status}`
    );
  }

  // Update milestone with revision request
  milestones[milestoneIndex].status = "Revision Requested";
  milestones[milestoneIndex].revisionRequest = {
    message: message.trim(),
    requestedAt: serverTimestamp(),
  };
  await updateDoc(dealDocRef, { milestones, updatedAt: serverTimestamp() });

  // Send notification email (non-blocking)
  try {
    await sendEmail({
      to_email: dealData.sellerEmail,
      to_name: "Seller",
      subject: `Revision Requested for: ${dealData.projectTitle}`,
      message: `The buyer has requested a revision for milestone "${milestones[milestoneIndex].title}". Please review their feedback and resubmit your work.`,
      deal_title: dealData.projectTitle,
      deal_url: `https://www.mountescrow.com/deals/${dealId}`,
    });
  } catch (emailError) {
    console.error(
      "Failed to send revision request notification email:",
      emailError
    );
  }
}
