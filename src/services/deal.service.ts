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
  proposal: { id: string } & ProposalData
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
      status: "Pending" as const,
    }));

    // Create deal data excluding the proposal-specific fields
    const { id, createdAt, updatedAt, ...proposalDataForDeal } = proposal;

    const dealData: Omit<DealData, "createdAt" | "updatedAt"> = {
      ...proposalDataForDeal,
      proposalId: proposal.id,
      status: "Awaiting Funding" as const,
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
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create deal from proposal. Please try again.");
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

  // Buyer only pays project amount + half of escrow fee
  const buyerEscrowFee = dealData.escrowFee / 2;
  const expectedAmount = dealData.totalAmount + buyerEscrowFee;

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

  try {
    // Find seller's user ID
    const sellerUserQuery = await getDocs(
      query(collection(db, "users"), where("email", "==", dealData.sellerEmail))
    );
    if (sellerUserQuery.empty)
      throw new Error("Seller user account not found.");
    const sellerId = sellerUserQuery.docs[0].id;

    // Calculate seller's portion after deducting their half of escrow fee
    const sellerEscrowFee = dealData.escrowFee / 2;
    const milestoneEscrowFee =
      (milestone.amount / dealData.totalAmount) * sellerEscrowFee;
    const sellerReceives = milestone.amount - milestoneEscrowFee;

    // Ensure seller receives a positive amount
    if (sellerReceives <= 0) {
      throw new Error(
        "Milestone amount is too small after escrow fee deduction"
      );
    }

    // Release payment to seller (minus their portion of escrow fee)
    await releaseFromEscrow(sellerId, dealId, milestone.title, sellerReceives);

    // Update milestone status
    const milestones = [...dealData.milestones];
    milestones[milestoneIndex].status = "Completed";
    await updateDoc(dealDocRef, { milestones, updatedAt: serverTimestamp() });

    // Fund next milestone or complete deal
    await fundNextMilestone(dealId, milestoneIndex);

    // Send notification email to seller (non-blocking)
    try {
      await sendEmail({
        to_email: dealData.sellerEmail,
        to_name: "Seller",
        subject: `Milestone Approved: ${dealData.projectTitle}`,
        message: `Your milestone "${
          milestone.title
        }" has been approved and payment of $${sellerReceives.toFixed(
          2
        )} has been released to your wallet.`,
        deal_title: dealData.projectTitle,
        deal_url: `https://www.mountescrow.com/deals/${dealId}`,
      });
    } catch (emailError) {
      console.error(
        "Failed to send milestone approval notification email:",
        emailError
      );
    }
  } catch (error) {
    console.error("Error in approveAndReleaseMilestone:", error);
    throw error;
  }
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

    // Send notification to seller about next milestone being funded
    try {
      await sendEmail({
        to_email: dealData.sellerEmail,
        to_name: "Seller",
        subject: `Next Milestone Funded: ${dealData.projectTitle}`,
        message: `The next milestone "${milestones[nextMilestoneIndex].title}" has been funded and is ready for you to start work.`,
        deal_title: dealData.projectTitle,
        deal_url: `https://www.mountescrow.com/deals/${dealId}`,
      });
    } catch (emailError) {
      console.error(
        "Failed to send next milestone funding notification email:",
        emailError
      );
    }
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
          message: `Congratulations! The deal "${dealData.projectTitle}" has been successfully completed. All milestones have been delivered and approved.`,
          deal_title: dealData.projectTitle,
          deal_url: `https://www.mountescrow.com/deals/${dealId}`,
        });
      }
      await sendEmail({
        to_email: dealData.sellerEmail,
        to_name: "Seller",
        subject: `Deal Completed: ${dealData.projectTitle}`,
        message: `Congratulations! The deal "${dealData.projectTitle}" has been successfully completed. All payments have been released to your wallet.`,
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
  files: File[] | null
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
      // Convert File[] to FileList for storage service compatibility
      const fileList = {
        length: files.length,
        item: (index: number) => files[index] || null,
        [Symbol.iterator]: function* () {
          for (let i = 0; i < files.length; i++) {
            yield files[i];
          }
        },
      } as FileList;

      uploadedFiles = await uploadMultipleFiles(
        dealId,
        milestoneIndex,
        fileList
      );
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
        message: `The seller has submitted work for milestone "${milestones[milestoneIndex].title}". Please review and approve it in your dashboard.`,
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
