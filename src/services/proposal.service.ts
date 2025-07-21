import { db, auth, storage } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  or,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User } from "firebase/auth";
import { sendEmail } from "./email.service";
import { validateEnvironmentVariables } from "@/lib/config";
import { createDealFromProposal, fundDeal } from "./deal.service"; // Import deal service functions

export interface MilestoneData {
  title: string;
  amount: number;
  description: string;
  dueDate: Date;
}

export interface ProposalData {
  projectTitle: string;
  description: string;
  sellerEmail: string;
  files?: string[]; // URLs of uploaded files
  milestones: MilestoneData[];
  totalAmount: number;
  escrowFee: number;
  escrowFeePayer: number; // New: Percentage buyer pays (25, 50, 75, 100)
  status:
    | "Pending"
    | "Accepted"
    | "Declined"
    | "Completed"
    | "AwaitingBuyerAcceptance"; // New status
  buyerId: string | null; // Can be null for seller-initiated proposals
  buyerEmail: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface CreateProposalData {
  projectTitle: string;
  description: string;
  counterpartyEmail: string; // New: Email of the other party
  creatorRole: "buyer" | "seller"; // New: Role of the creator
  files?: File[]; // Files to upload
  milestones: MilestoneData[];
  totalAmount: number;
  escrowFee: number;
  escrowFeePayer: number; // New: Percentage buyer pays (25, 50, 75, 100)
}

async function checkUserPermissions(): Promise<string> {
  try {
    validateEnvironmentVariables();
  } catch (error) {
    throw new Error(`System configuration error: ${(error as Error).message}`);
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated.");
  }
  if (!user.emailVerified) {
    throw new Error("Email not verified. Please verify your email to proceed.");
  }

  return user.uid;
}

async function uploadProjectFiles(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map(async (file, index) => {
    try {
      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${timestamp}_${index}_${file.name}`;
      const storageRef = ref(storage, `projects/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      throw new Error(`Failed to upload file: ${file.name}`);
    }
  });

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading files:", error);
    throw new Error("Failed to upload one or more files. Please try again.");
  }
}

export async function createProposal(proposalData: CreateProposalData) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  await checkUserPermissions();

  // Validate proposal data
  if (!proposalData.projectTitle?.trim()) {
    throw new Error("Project title is required");
  }
  if (!proposalData.description?.trim()) {
    throw new Error("Project description is required");
  }
  if (!proposalData.counterpartyEmail?.trim()) {
    throw new Error("Counterparty email is required");
  }
  if (!proposalData.milestones?.length) {
    throw new Error("At least one milestone is required");
  }
  if (proposalData.totalAmount <= 0) {
    throw new Error("Total amount must be greater than 0");
  }
  if (proposalData.escrowFee < 0) {
    throw new Error("Escrow fee cannot be negative");
  }
  if (![25, 50, 75, 100].includes(proposalData.escrowFeePayer)) {
    throw new Error(
      "Invalid escrow fee payer percentage. Must be 25, 50, 75, or 100."
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(proposalData.counterpartyEmail.trim())) {
    throw new Error("Please enter a valid email address for the counterparty");
  }

  // Validate milestones
  proposalData.milestones.forEach((milestone, index) => {
    if (!milestone.title?.trim()) {
      throw new Error(`Milestone ${index + 1}: Title is required`);
    }
    if (!milestone.description?.trim()) {
      throw new Error(`Milestone ${index + 1}: Description is required`);
    }
    if (milestone.amount <= 0) {
      throw new Error(`Milestone ${index + 1}: Amount must be greater than 0`);
    }
    if (!milestone.dueDate) {
      throw new Error(`Milestone ${index + 1}: Due date is required`);
    }
    // Check if due date is in the past
    if (new Date(milestone.dueDate) < new Date()) {
      throw new Error(`Milestone ${index + 1}: Due date cannot be in the past`);
    }
  });

  try {
    // Upload files first
    let fileUrls: string[] = [];
    if (proposalData.files && proposalData.files.length > 0) {
      fileUrls = await uploadProjectFiles(proposalData.files);
    }

    let buyerId: string | null;
    let buyerEmail: string | null;
    let sellerEmail: string;
    let status: ProposalData["status"];
    let emailRecipient: string;
    let emailSubject: string;
    let emailMessage: string;

    if (proposalData.creatorRole === "buyer") {
      buyerId = user.uid;
      buyerEmail = user.email;
      sellerEmail = proposalData.counterpartyEmail.trim();
      status = "Pending"; // Buyer-initiated proposals are pending seller acceptance
      emailRecipient = sellerEmail;
      emailSubject = `New Proposal: ${proposalData.projectTitle}`;
      emailMessage = `You've received a new proposal from ${user.email} for the project "${proposalData.projectTitle}".`;
    } else {
      // creatorRole === "seller"
      buyerId = null; // Buyer ID is unknown until they accept
      buyerEmail = proposalData.counterpartyEmail.trim(); // Counterparty is the buyer
      sellerEmail = user.email!; // Current user is the seller
      status = "AwaitingBuyerAcceptance"; // Seller-initiated proposals await buyer acceptance
      emailRecipient = buyerEmail;
      emailSubject = `New Proposal Invitation: ${proposalData.projectTitle}`;
      emailMessage = `You've received a new proposal invitation from ${user.email} for the project "${proposalData.projectTitle}". Please review and accept to proceed.`;
    }

    // Create the proposal document
    const proposalDocData: Omit<ProposalData, "createdAt" | "updatedAt"> = {
      projectTitle: proposalData.projectTitle.trim(),
      description: proposalData.description.trim(),
      sellerEmail: sellerEmail,
      files: fileUrls,
      milestones: proposalData.milestones,
      totalAmount: proposalData.totalAmount,
      escrowFee: proposalData.escrowFee,
      escrowFeePayer: proposalData.escrowFeePayer,
      status: status,
      buyerId: buyerId,
      buyerEmail: buyerEmail,
    };

    const docRef = await addDoc(collection(db, "proposals"), {
      ...proposalDocData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Send email notification
    try {
      await sendEmail({
        to_email: emailRecipient,
        to_name: proposalData.creatorRole === "buyer" ? "Seller" : "Buyer",
        subject: emailSubject,
        message: emailMessage,
        deal_title: proposalData.projectTitle,
        deal_url: `${window.location.origin}/proposals/${docRef.id}`,
      });
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't throw here - proposal was created successfully
    }

    return docRef.id;
  } catch (error) {
    console.error("Error creating proposal:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to create proposal. Please try again.");
  }
}

export async function getProposals(
  user: User
): Promise<({ id: string } & ProposalData)[]> {
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    const proposalsCol = collection(db, "proposals");
    const q = query(
      proposalsCol,
      or(
        where("buyerId", "==", user.uid),
        where("sellerEmail", "==", user.email),
        where("buyerEmail", "==", user.email) // Include proposals where current user is the buyer (for seller-initiated)
      )
    );
    const querySnapshot = await getDocs(q);

    const proposals: ({ id: string } & ProposalData)[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as ProposalData;
      proposals.push({ id: doc.id, ...data });
    });

    // Sort by creation date (newest first)
    proposals.sort(
      (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
    );

    return proposals;
  } catch (error) {
    console.error("Error fetching proposals:", error);
    throw new Error("Failed to fetch proposals. Please try again.");
  }
}

export async function getProposalById(
  id: string
): Promise<({ id: string } & ProposalData) | null> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  if (!id?.trim()) {
    throw new Error("Proposal ID is required");
  }

  try {
    const proposalDoc = doc(db, "proposals", id);
    const docSnap = await getDoc(proposalDoc);

    if (!docSnap.exists()) {
      return null;
    }

    const proposalData = docSnap.data() as ProposalData;

    // Check if user has permission to view this proposal
    if (
      proposalData.buyerId === user.uid ||
      proposalData.sellerEmail === user.email ||
      proposalData.buyerEmail === user.email // Allow buyer to view seller-initiated proposals
    ) {
      return { id: docSnap.id, ...proposalData };
    } else {
      throw new Error("You are not authorized to view this proposal");
    }
  } catch (error) {
    console.error("Error fetching proposal:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to fetch proposal. Please try again.");
  }
}

export async function updateProposalStatus(
  id: string,
  status: "Accepted" | "Declined"
) {
  await checkUserPermissions();

  if (!id?.trim()) {
    throw new Error("Proposal ID is required");
  }

  if (!["Accepted", "Declined"].includes(status)) {
    throw new Error("Invalid status. Must be 'Accepted' or 'Declined'");
  }

  try {
    const proposalDocRef = doc(db, "proposals", id);
    const proposalDoc = await getDoc(proposalDocRef);

    if (!proposalDoc.exists()) {
      throw new Error("Proposal not found");
    }

    const proposalData = proposalDoc.data() as ProposalData;

    // Only allow status updates from Pending (buyer-initiated) or AwaitingBuyerAcceptance (seller-initiated)
    if (!["Pending", "AwaitingBuyerAcceptance"].includes(proposalData.status)) {
      throw new Error(
        `Cannot ${status.toLowerCase()} proposal. Current status: ${
          proposalData.status
        }`
      );
    }

    // Ensure only the seller can accept/decline buyer-initiated proposals
    if (
      proposalData.status === "Pending" &&
      auth.currentUser?.email !== proposalData.sellerEmail
    ) {
      throw new Error(
        "You are not authorized to update this proposal's status."
      );
    }

    // Update the proposal status
    await updateDoc(proposalDocRef, {
      status: status,
      updatedAt: serverTimestamp(),
    });

    // Send email notification to buyer
    if (proposalData.buyerEmail) {
      try {
        await sendEmail({
          to_email: proposalData.buyerEmail,
          to_name: "Buyer",
          subject: `Proposal ${status}: ${proposalData.projectTitle}`,
          message: `The proposal "${
            proposalData.projectTitle
          }" has been ${status.toLowerCase()} by the seller. Please check your dashboard for details.`,
          deal_title: proposalData.projectTitle,
          deal_url: `${window.location.origin}/proposals/${id}`,
        });
      } catch (emailError) {
        console.error(
          "Failed to send proposal status notification email:",
          emailError
        );
        // Don't throw here - status was updated successfully
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating proposal status:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to update proposal status. Please try again.");
  }
}

export async function acceptAndFundSellerInitiatedProposal(
  proposalId: string,
  buyerUid: string
) {
  const user = auth.currentUser;
  if (!user || user.uid !== buyerUid) {
    throw new Error(
      "User not authenticated or authorized to fund this proposal."
    );
  }

  const proposalDocRef = doc(db, "proposals", proposalId);
  const proposalDoc = await getDoc(proposalDocRef);

  if (!proposalDoc.exists()) {
    throw new Error("Proposal not found.");
  }

  const proposalData = proposalDoc.data() as ProposalData;

  if (proposalData.status !== "AwaitingBuyerAcceptance") {
    throw new Error(
      `Cannot accept and fund. Proposal status: ${proposalData.status}`
    );
  }

  if (user.email !== proposalData.buyerEmail) {
    throw new Error("You are not the intended buyer for this proposal.");
  }

  try {
    // Update proposal status and set buyerId
    await updateDoc(proposalDocRef, {
      status: "Accepted",
      buyerId: buyerUid,
      updatedAt: serverTimestamp(),
    });

    // Create updated proposal object with accepted status and buyerId for deal creation
    const updatedProposal = {
      ...proposalData,
      id: proposalId, // Add ID for deal creation
      status: "Accepted" as const,
      buyerId: buyerUid,
    };

    // Create deal from the updated proposal
    const dealId = await createDealFromProposal(updatedProposal);

    // Fund the deal immediately
    // Buyer only pays project amount + their portion of escrow fee
    const buyerEscrowFeePortion =
      proposalData.escrowFee * (proposalData.escrowFeePayer / 100);
    const totalToFund = proposalData.totalAmount + buyerEscrowFeePortion;

    await fundDeal(dealId, buyerUid, totalToFund);

    // Send notification email to seller
    try {
      await sendEmail({
        to_email: proposalData.sellerEmail,
        to_name: "Seller",
        subject: `Proposal Accepted & Funded: ${proposalData.projectTitle}`,
        message: `Your proposal for "${proposalData.projectTitle}" has been accepted and funded by the buyer. A new deal has been created and is now in progress.`,
        deal_title: proposalData.projectTitle,
        deal_url: `${window.location.origin}/deals/${dealId}`,
      });
    } catch (emailError) {
      console.error(
        "Failed to send acceptance/funding notification email:",
        emailError
      );
    }

    return dealId;
  } catch (error) {
    console.error(
      "Error accepting and funding seller-initiated proposal:",
      error
    );
    // Revert proposal status if funding fails? This can get complex. For now, just re-throw.
    throw error;
  }
}
