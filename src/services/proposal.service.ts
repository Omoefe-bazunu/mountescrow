
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, updateDoc, or } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { sendEmail } from './email.service';
import { getUserWallet } from './fcmb.service';
import { validateEnvironmentVariables } from '@/lib/config';

export interface MilestoneData {
  title: string;
  amount: number;
  description: string;
  dueDate: Date;
  files?: any;
}

export interface ProposalData {
  projectTitle: string;
  description: string;
  sellerEmail: string;
  milestones: MilestoneData[];
  totalAmount: number;
  escrowFee: number;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
  buyerId: string;
  buyerEmail: string | null;
  createdAt: any;
  updatedAt: any;
}

async function checkUserPermissions(): Promise<string> {
    // Validate environment variables first
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

    const wallet = await getUserWallet(user.uid);
    if (wallet?.kycStatus !== 'approved') {
        throw new Error("KYC not approved. Please complete KYC verification.");
    }
    return user.uid;
}

export async function createProposal(proposalData: Omit<ProposalData, 'buyerId' | 'buyerEmail' | 'createdAt' | 'updatedAt'>) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  await checkUserPermissions();

  // Validate proposal data
  if (!proposalData.projectTitle?.trim()) {
    throw new Error('Project title is required');
  }
  if (!proposalData.description?.trim()) {
    throw new Error('Project description is required');
  }
  if (!proposalData.sellerEmail?.trim()) {
    throw new Error('Seller email is required');
  }
  if (!proposalData.milestones || proposalData.milestones.length === 0) {
    throw new Error('At least one milestone is required');
  }
  if (proposalData.totalAmount <= 0) {
    throw new Error('Total amount must be greater than 0');
  }
  if (proposalData.escrowFee < 0) {
    throw new Error('Escrow fee cannot be negative');
  }

  // Validate milestones
  for (let i = 0; i < proposalData.milestones.length; i++) {
    const milestone = proposalData.milestones[i];
    if (!milestone.title?.trim()) {
      throw new Error(`Milestone ${i + 1}: Title is required`);
    }
    if (!milestone.description?.trim()) {
      throw new Error(`Milestone ${i + 1}: Description is required`);
    }
    if (milestone.amount <= 0) {
      throw new Error(`Milestone ${i + 1}: Amount must be greater than 0`);
    }
    if (!milestone.dueDate) {
      throw new Error(`Milestone ${i + 1}: Due date is required`);
    }
  }

  // Validate total amount matches sum of milestones
  const calculatedTotal = proposalData.milestones.reduce((sum, m) => sum + m.amount, 0);
  if (Math.abs(calculatedTotal - proposalData.totalAmount) > 0.01) {
    throw new Error('Total amount does not match sum of milestone amounts');
  }
  try {
    const docRef = await addDoc(collection(db, 'proposals'), {
      ...proposalData,
      buyerId: user.uid,
      buyerEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Send email notification (non-blocking)
    try {
      await sendEmail({
          to_email: proposalData.sellerEmail.trim(),
          to_name: 'Seller',
          subject: 'New Escrow Proposal from Mountescrow',
          message: `You have received a new project proposal titled "${proposalData.projectTitle}" from ${user.email}. Please log in to your Mountescrow dashboard to review and respond.`,
          deal_title: proposalData.projectTitle,
          deal_url: `https://www.mountescrow.com/proposals/${docRef.id}`
      });
    } catch (emailError) {
      console.error('Failed to send proposal notification email:', emailError);
      // Don't fail the proposal creation if email fails
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating proposal: ', error);
    throw error;
  }
}

export async function getProposals(user: User): Promise<({ id: string } & ProposalData)[]> {
    if (!user) {
        throw new Error("User not authenticated");
    }

    const proposalsCol = collection(db, 'proposals');
    const q = query(proposalsCol, 
        or(
            where("buyerId", "==", user.uid),
            where("sellerEmail", "==", user.email)
        )
    );
    const querySnapshot = await getDocs(q);

    const proposals: ({ id: string } & ProposalData)[] = [];
    querySnapshot.forEach((doc) => {
        proposals.push({ id: doc.id, ...doc.data() as ProposalData });
    });
    
    proposals.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));

    return proposals;
}

export async function getProposalById(id: string): Promise<({ id: string } & ProposalData) | null> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated");
    }

    const proposalDoc = doc(db, 'proposals', id);
    const docSnap = await getDoc(proposalDoc);

    if (docSnap.exists()) {
        const proposalData = docSnap.data() as ProposalData;
        if (proposalData.buyerId === user.uid || proposalData.sellerEmail === user.email) {
            return { id: docSnap.id, ...proposalData };
        } else {
            console.error("User not authorized to view this proposal.");
            return null;
        }
    } else {
        console.log("No such document!");
        return null;
    }
}


export async function updateProposalStatus(id: string, status: 'Accepted' | 'Declined') {
    await checkUserPermissions();
    
    if (!id?.trim()) {
        throw new Error('Proposal ID is required');
    }
    
    if (!['Accepted', 'Declined'].includes(status)) {
        throw new Error('Invalid status. Must be Accepted or Declined');
    }
    
    const proposalDocRef = doc(db, 'proposals', id);
    const proposalDoc = await getDoc(proposalDocRef);
    
    if (!proposalDoc.exists()) {
        throw new Error('Proposal not found');
    }
    
    const proposalData = proposalDoc.data() as ProposalData;
    
    if (proposalData.status !== 'Pending') {
        throw new Error(`Cannot ${status.toLowerCase()} proposal. Current status: ${proposalData.status}`);
    }
    
    await updateDoc(proposalDocRef, {
        status: status,
        updatedAt: serverTimestamp()
    });

    // Send notification email (non-blocking)
    if (proposalData.buyerEmail) {
        try {
            await sendEmail({
                to_email: proposalData.buyerEmail,
                to_name: 'Buyer',
                subject: `Proposal ${status}: ${proposalData.projectTitle}`,
                message: `The proposal "${proposalData.projectTitle}" has been ${status.toLowerCase()} by the seller. Please check your dashboard for details.`,
                deal_title: proposalData.projectTitle,
                deal_url: `https://www.mountescrow.com/proposals/${id}`
            });
        } catch (emailError) {
            console.error('Failed to send proposal status notification email:', emailError);
        }
    }
}
