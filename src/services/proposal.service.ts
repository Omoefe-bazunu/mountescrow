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
  status: "Pending" | "Accepted" | "Declined" | "Completed";
  buyerId: string;
  buyerEmail: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface CreateProposalData {
  projectTitle: string;
  description: string;
  sellerEmail: string;
  files?: File[]; // Files to upload
  milestones: MilestoneData[];
  totalAmount: number;
  escrowFee: number;
  status: "Pending" | "Accepted" | "Declined" | "Completed";
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
  if (!proposalData.sellerEmail?.trim()) {
    throw new Error("Seller email is required");
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

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(proposalData.sellerEmail.trim())) {
    throw new Error("Please enter a valid email address");
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

    // Create the proposal document
    const proposalDocData = {
      projectTitle: proposalData.projectTitle.trim(),
      description: proposalData.description.trim(),
      sellerEmail: proposalData.sellerEmail.trim(),
      files: fileUrls,
      milestones: proposalData.milestones,
      totalAmount: proposalData.totalAmount,
      escrowFee: proposalData.escrowFee,
      status: proposalData.status,
      buyerId: user.uid,
      buyerEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "proposals"), proposalDocData);

    // Send email notification
    try {
      await sendEmail({
        to_email: proposalData.sellerEmail.trim(),
        to_name: "Seller",
        subject: `New Proposal: ${proposalData.projectTitle}`,
        message: `You've received a new proposal from ${user.email} for the project "${proposalData.projectTitle}".`,
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
        where("sellerEmail", "==", user.email)
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
      proposalData.sellerEmail === user.email
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

    if (proposalData.status !== "Pending") {
      throw new Error(
        `Cannot ${status.toLowerCase()} proposal. Current status: ${
          proposalData.status
        }`
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
