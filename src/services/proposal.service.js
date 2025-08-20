import { db, storage, auth } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { refreshFcmbWalletBalance } from "@/lib/fcmb";

// ---------- Services ----------
export async function createProposal(data) {
  const {
    projectTitle,
    description,
    counterpartyEmail,
    creatorRole, // "buyer" | "seller"
    milestones,
    totalAmount,
    escrowFee,
    escrowFeePayer, // numeric split percentage paid by buyer (0-100)
    files,
  } = data;

  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");

  const proposalRef = doc(collection(db, "proposals"));

  // Upload files (optional)
  let fileUrls = [];
  if (files && files.length > 0) {
    fileUrls = await Promise.all(
      files.map(async (file, index) => {
        const storageRef = ref(
          storage,
          `proposals/${proposalRef.id}/${Date.now()}_${index}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      })
    );
  }

  // Build data to satisfy Firestore rules
  const base = {
    projectTitle,
    description,
    milestones,
    totalAmount: Number(totalAmount) || 0,
    escrowFee: Number(escrowFee) || 0,
    escrowFeePayer: Number(escrowFeePayer) || 0,
    files: fileUrls,
    creatorEmail: user.email,
    creatorRole,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const proposalData =
    creatorRole === "buyer"
      ? {
          ...base,
          buyerId: user.uid,
          buyerEmail: user.email,
          sellerEmail: counterpartyEmail,
          status: "Pending",
        }
      : {
          ...base,
          buyerId: null, // required by rules for seller-initiated
          buyerEmail: counterpartyEmail,
          sellerEmail: user.email,
          status: "AwaitingBuyerAcceptance",
        };

  await setDoc(proposalRef, proposalData);

  // Return data for API route to send email
  return {
    proposalId: proposalRef.id,
    emailData: {
      type: creatorRole === "buyer" ? "invitation" : "created",
      recipientEmail: counterpartyEmail,
      recipientName: counterpartyEmail,
      projectTitle,
      totalAmount: Number(totalAmount) || 0,
      description,
      creatorEmail: user.email,
      proposalLink: `https://www.mountescrow.com/proposals/${proposalRef.id}`,
    },
  };
}

export async function getProposalById(id) {
  const proposalRef = doc(db, "proposals", id);
  const proposalSnap = await getDoc(proposalRef);

  if (!proposalSnap.exists()) return null;

  const user = auth.currentUser;
  const data = proposalSnap.data();

  if (
    user &&
    (user.uid === data.buyerId ||
      user.email === data.sellerEmail ||
      user.email === data.buyerEmail)
  ) {
    return { id: proposalSnap.id, ...data };
  }

  return null;
}

/**
 * Fetch proposals the user is allowed to read under rules:
 * - buyerId == user.uid OR
 * - buyerEmail == user.email OR
 * - sellerEmail == user.email
 */
export async function getProposals(user) {
  if (!user) throw new Error("User must be authenticated");

  const byBuyerEmail = query(
    collection(db, "proposals"),
    where("buyerEmail", "==", user.email)
  );
  const bySellerEmail = query(
    collection(db, "proposals"),
    where("sellerEmail", "==", user.email)
  );
  const byBuyerId = query(
    collection(db, "proposals"),
    where("buyerId", "==", user.uid)
  );

  const [snap1, snap2, snap3] = await Promise.all([
    getDocs(byBuyerEmail),
    getDocs(bySellerEmail),
    getDocs(byBuyerId),
  ]);

  const all = [...snap1.docs, ...snap2.docs, ...snap3.docs].map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  // Deduplicate by id
  const unique = Object.values(
    all.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {})
  );

  return unique;
}

/**
 * Updates status (and updatedAt). Optionally include decline reason.
 * Firestore rules expect only specific fields to change:
 * - Buyer->Seller flow: allowed keys ['status','updatedAt']
 * - Seller->Buyer acceptance: allowed keys ['status','buyerId','updatedAt'] (use acceptAndFundSellerInitiatedProposal)
 */
export async function updateProposalStatus(
  proposalId,
  status,
  reason = "No reason provided"
) {
  const proposalRef = doc(db, "proposals", proposalId);
  const proposalSnap = await getDoc(proposalRef);

  if (!proposalSnap.exists()) throw new Error("Proposal not found");

  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated");

  const proposalData = proposalSnap.data();

  // Only update allowed fields per rules (no buyerId here)
  await updateDoc(proposalRef, {
    status,
    updatedAt: serverTimestamp(),
  });

  // Return data for API route to send email
  return {
    emailData: {
      type: status.toLowerCase(),
      recipientEmail:
        status === "Accepted" || status === "Declined"
          ? proposalData.creatorEmail
          : proposalData.buyerEmail || proposalData.sellerEmail,
      recipientName:
        status === "Accepted" || status === "Declined"
          ? proposalData.creatorEmail
          : proposalData.buyerEmail || proposalData.sellerEmail,
      projectTitle: proposalData.projectTitle,
      totalAmount: proposalData.totalAmount || 0,
      reason,
      dealLink: `https://www.mountescrow.com/deals/${proposalId}`,
      supportLink: "https://www.mountescrow.com/contact-us",
    },
  };
}

/**
 * Accepts a seller-initiated proposal ("AwaitingBuyerAcceptance"),
 * checks buyer wallet balance, debits, sets proposal to Accepted
 * while ALSO setting buyerId, and creates a funded deal.
 * Important: include updatedAt in proposal update to satisfy rules.
 */
export async function acceptAndFundSellerInitiatedProposal(
  proposalId,
  buyerId
) {
  const proposalRef = doc(db, "proposals", proposalId);
  const proposalSnap = await getDoc(proposalRef);

  if (!proposalSnap.exists()) throw new Error("Proposal not found");

  const proposalData = proposalSnap.data();
  if (proposalData.status !== "AwaitingBuyerAcceptance") {
    throw new Error("Proposal not in a state to be accepted");
  }

  const userRef = doc(db, "users", buyerId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("User not found");

  const userData = userSnap.data();
  if (!userData.walletCreated) throw new Error("User must have a wallet");

  const balance = await refreshFcmbWalletBalance(
    buyerId,
    userData.accountNumber
  );

  // Buyer pays escrowFee proportion according to escrowFeePayer %
  const buyerEscrowPortion =
    (Number(proposalData.escrowFee) || 0) *
    ((Number(proposalData.escrowFeePayer) || 0) / 100);

  const debitTotal =
    (Number(proposalData.totalAmount) || 0) + buyerEscrowPortion;

  if (balance < debitTotal) throw new Error("Insufficient balance");

  // Debit wallet (this is a placeholder update; real money ops should be via secure backend)
  await updateDoc(userRef, { balance: balance - debitTotal });

  // Update proposal per rules (status+buyerId+updatedAt only)
  await updateDoc(proposalRef, {
    status: "Accepted",
    buyerId,
    updatedAt: serverTimestamp(),
  });

  // Create deal
  const dealRef = doc(collection(db, "deals"));
  const dealData = {
    proposalId,
    projectTitle: proposalData.projectTitle,
    buyerId,
    sellerEmail: proposalData.sellerEmail,
    buyerEmail: proposalData.buyerEmail,
    totalAmount: Number(proposalData.totalAmount) || 0,
    escrowFee: Number(proposalData.escrowFee) || 0,
    escrowFeePayer: Number(proposalData.escrowFeePayer) || 0,
    milestones: proposalData.milestones || [],
    status: "Funded",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(dealRef, dealData);

  // Return data for API route to send email
  return {
    dealId: dealRef.id,
    emailData: {
      type: "accepted",
      recipientEmail: proposalData.sellerEmail,
      recipientName: proposalData.sellerEmail,
      projectTitle: proposalData.projectTitle,
      totalAmount: Number(proposalData.totalAmount) || 0,
      dealLink: `https://www.mountescrow.com/deals/${dealRef.id}`,
    },
  };
}
