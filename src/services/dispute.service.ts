import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, updateDoc, or } from 'firebase/firestore';
import { sendEmail } from './email.service';
import { getUserWallet } from './fcmb.service';

export interface DisputeData {
  dealId: string;
  dealTitle: string;
  disputedBy: string; // userId
  disputedByEmail: string;
  disputedAgainst: string; // email of other party
  subject: string;
  description: string;
  category: 'milestone_quality' | 'payment_delay' | 'communication' | 'contract_breach' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  evidence: {
    files: any[];
    screenshots: any[];
    messages: string[];
  };
  resolution?: {
    resolvedBy: string; // admin userId
    resolutionType: 'refund_buyer' | 'release_seller' | 'partial_refund' | 'no_action';
    amount?: number;
    notes: string;
    resolvedAt: any;
  };
  adminNotes: string[];
  createdAt: any;
  updatedAt: any;
}

async function checkUserPermissions(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");
  if (!user.emailVerified) throw new Error("Email not verified. Please verify your email to proceed.");

  const wallet = await getUserWallet(user.uid);
  if (wallet?.kycStatus !== 'approved') {
    throw new Error("KYC not approved. Please complete KYC verification.");
  }
  return user.uid;
}

export async function createDispute(disputeData: Omit<DisputeData, 'disputedBy' | 'disputedByEmail' | 'status' | 'adminNotes' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const userId = await checkUserPermissions();
  const user = auth.currentUser!;

  try {
    const docRef = await addDoc(collection(db, 'disputes'), {
      ...disputeData,
      disputedBy: userId,
      disputedByEmail: user.email,
      status: 'open',
      adminNotes: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Notify admin via email
    await sendEmail({
      to_email: 'admin@mountescrow.com', // Replace with actual admin email
      to_name: 'Admin',
      subject: `🚨 New Dispute Filed - ${disputeData.subject}`,
      message: `A new dispute has been filed by ${user.email} for deal "${disputeData.dealTitle}". 
      
Category: ${disputeData.category}
Priority: ${disputeData.priority}
Description: ${disputeData.description}

Please review and take action in the admin dashboard.`,
      deal_title: disputeData.dealTitle,
      deal_url: `https://www.mountescrow.com/admin/disputes/${docRef.id}`
    });

    // Notify the other party
    await sendEmail({
      to_email: disputeData.disputedAgainst,
      to_name: 'User',
      subject: `Dispute Filed for Deal: ${disputeData.dealTitle}`,
      message: `A dispute has been filed regarding the deal "${disputeData.dealTitle}". Our support team will review the case and contact you if additional information is needed.`,
      deal_title: disputeData.dealTitle,
      deal_url: `https://www.mountescrow.com/disputes/${docRef.id}`
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating dispute:', error);
    throw error;
  }
}

export async function getDisputes(): Promise<({ id: string } & DisputeData)[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const disputesCol = collection(db, 'disputes');
  const q = query(disputesCol, 
    or(
      where("disputedBy", "==", user.uid),
      where("disputedAgainst", "==", user.email)
    )
  );
  
  const querySnapshot = await getDocs(q);

  const disputes: ({ id: string } & DisputeData)[] = [];
  querySnapshot.forEach((doc) => {
    disputes.push({ id: doc.id, ...doc.data() as DisputeData });
  });
  
  disputes.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  return disputes;
}

export async function getDisputeById(id: string): Promise<({ id: string } & DisputeData) | null> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const disputeDoc = doc(db, 'disputes', id);
  const docSnap = await getDoc(disputeDoc);

  if (docSnap.exists()) {
    const disputeData = docSnap.data() as DisputeData;
    if (disputeData.disputedBy === user.uid || disputeData.disputedAgainst === user.email) {
      return { id: docSnap.id, ...disputeData };
    } else {
      console.error("User not authorized to view this dispute.");
      return null;
    }
  } else {
    console.log("No such document!");
    return null;
  }
}

export async function updateDisputeStatus(id: string, status: DisputeData['status'], adminNotes?: string) {
  await checkUserPermissions();
  
  const updateData: any = {
    status,
    updatedAt: serverTimestamp()
  };
  
  if (adminNotes) {
    const disputeDoc = await getDoc(doc(db, 'disputes', id));
    if (disputeDoc.exists()) {
      const currentNotes = disputeDoc.data().adminNotes || [];
      updateData.adminNotes = [...currentNotes, `${new Date().toISOString()}: ${adminNotes}`];
    }
  }

  await updateDoc(doc(db, 'disputes', id), updateData);
}