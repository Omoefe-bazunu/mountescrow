"use server";

import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// --- CONFIGURATION ---
// Ensure these are set in your environment variables
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_API_BASE_URL = "https://api.flutterwave.com"; // Flutterwave API base URL

// --- LOGGING ---
async function logEvent(
  level: "INFO" | "WARN" | "ERROR",
  service: string,
  message: string,
  data: any = {}
) {
  try {
    await db.collection("logs").add({
      timestamp: FieldValue.serverTimestamp(),
      level,
      service,
      message,
      ...data,
    });
    console.log(`[${level}] ${service}: ${message}`, data);
  } catch (error) {
    console.error(`Failed to write to log: ${message}`, error);
  }
}

// --- API WRAPPER ---
async function flutterwaveApiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error("Flutterwave secret key is not configured.");
  }
  if (!FLUTTERWAVE_API_BASE_URL) {
    throw new Error("Flutterwave API base URL is not configured.");
  }

  const url = `${FLUTTERWAVE_API_BASE_URL}${endpoint}`;

  console.log("Making Flutterwave API Request:", {
    method: options.method || "GET",
    url,
    hasBody: !!options.body,
  });

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      Accept: "application/json",
      ...options.headers,
    },
  });

  console.log("Flutterwave API Response:", {
    status: response.status,
    statusText: response.statusText,
    url,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    console.error("Flutterwave API Error:", {
      status: response.status,
      errorData,
    });
    await logEvent(
      "ERROR",
      "FLUTTERWAVE_API",
      `API Request Failed on ${endpoint}`,
      {
        status: response.status,
        errorData,
      }
    );
    throw new Error(
      `Flutterwave API Error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const responseData = await response.json();
  console.log("Flutterwave API Success:", {
    endpoint,
    responseKeys: Object.keys(responseData),
  });
  return responseData;
}

// --- WALLET & USER MANAGEMENT ---

export interface UserWallet {
  userId: string;
  // Flutterwave specific IDs
  bvnReference?: string; // Reference from BVN consent initiation
  virtualAccountId?: string; // ID of the virtual account
  accountNumber?: string; // Virtual account number
  bankName?: string; // Bank name for the virtual account
  balance: number; // Current balance (might be managed internally or fetched)
  kycStatus: "pending" | "approved" | "rejected" | "awaiting_consent"; // New status for BVN flow
  createdAt: any;
  updatedAt: any;
}

interface InitiateBvnConsentResponse {
  success: boolean;
  message: string;
  redirect_url?: string;
  reference?: string;
  error?: string;
}

export async function initiateBvnVerification(
  userId: string,
  userDetails: {
    bvn: string;
    firstName: string;
    lastName: string;
    phone: string;
    dob: string;
  },
  redirectUrl: string // URL where Flutterwave redirects after consent
): Promise<InitiateBvnConsentResponse> {
  try {
    console.log("Starting BVN consent initiation for user:", userId);

    if (
      !userId ||
      !userDetails.bvn ||
      !userDetails.firstName ||
      !userDetails.lastName ||
      !userDetails.phone ||
      !userDetails.dob
    ) {
      throw new Error("Missing required user details for BVN verification");
    }
    if (!/^\d{11}$/.test(userDetails.bvn))
      throw new Error("BVN must be exactly 11 digits");

    // Sanitize phone number to be 10 digits (e.g., 23480...)
    let formattedPhone = userDetails.phone.replace(/[\s\-\(\)]/g, "");
    if (formattedPhone.startsWith("+234")) {
      formattedPhone = formattedPhone.substring(4);
    } else if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.substring(1);
    }
    // Ensure it's 10 digits after stripping prefix
    if (!/^\d{10}$/.test(formattedPhone)) {
      throw new Error(
        "Invalid phone number format. It must resolve to 10 digits."
      );
    }

    await logEvent("INFO", "FLUTTERWAVE_SERVICE", "Initiating BVN consent", {
      userId,
    });

    const payload = {
      bvn: userDetails.bvn,
      firstname: userDetails.firstName.trim(),
      lastname: userDetails.lastName.trim(),
      redirect_url: redirectUrl,
    };

    const response = await flutterwaveApiRequest("/v3/bvn/verifications", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (response.status === "success") {
      // Update user's KYC status to awaiting_consent
      await db.collection("userWallets").doc(userId).set(
        {
          userId,
          bvnReference: response.data.reference,
          kycStatus: "awaiting_consent",
          balance: 0, // Default balance
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ); // Use merge to avoid overwriting existing fields

      await logEvent(
        "INFO",
        "FLUTTERWAVE_SERVICE",
        "BVN consent initiated successfully",
        { userId, reference: response.data.reference }
      );
      return {
        success: true,
        message: response.message,
        redirect_url: response.data.url,
        reference: response.data.reference,
      };
    } else {
      await logEvent(
        "ERROR",
        "FLUTTERWAVE_SERVICE",
        "Failed to initiate BVN consent",
        { userId, error: response.message }
      );
      return {
        success: false,
        message: response.message,
        error: response.message,
      };
    }
  } catch (error: any) {
    await logEvent(
      "ERROR",
      "FLUTTERWAVE_SERVICE",
      "Exception during BVN consent initiation",
      { userId, error: error.message }
    );
    return {
      success: false,
      message: "An unexpected error occurred.",
      error: error.message,
    };
  }
}

export async function handleBvnConsentCallback(
  userId: string,
  bvnReference: string,
  userDetails: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  }
): Promise<{ success: boolean; message: string; wallet?: UserWallet }> {
  try {
    await logEvent(
      "INFO",
      "FLUTTERWAVE_SERVICE",
      "Handling BVN consent callback",
      { userId, bvnReference }
    );

    // Step 1: Verify BVN consent status and retrieve BVN data
    const bvnVerificationResponse = await flutterwaveApiRequest(
      `/v3/bvn/verifications/${bvnReference}`,
      { method: "GET" }
    );

    if (
      bvnVerificationResponse.status !== "success" ||
      bvnVerificationResponse.data.status !== "COMPLETED"
    ) {
      await db.collection("userWallets").doc(userId).update({
        kycStatus: "rejected",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await logEvent(
        "WARN",
        "FLUTTERWAVE_SERVICE",
        "BVN consent not completed or failed",
        { userId, bvnReference, status: bvnVerificationResponse.data.status }
      );
      return {
        success: false,
        message: "BVN verification not completed or failed.",
      };
    }

    // Step 2: Create a Virtual Account for the user
    const virtualAccountPayload = {
      email: userDetails.email,
      is_permanent: true, // Or false if temporary accounts are desired
      bvn: bvnVerificationResponse.data.bvn_data.bvn, // Use BVN from verified data
      phonenumber: userDetails.phone,
      firstname: userDetails.firstName,
      lastname: userDetails.lastName,
      narration: `Virtual Account for ${userDetails.firstName} ${userDetails.lastName}`,
      tx_ref: `VA-${userId}-${Date.now()}`, // Unique transaction reference
    };

    const virtualAccountResponse = await flutterwaveApiRequest(
      "/v3/virtual-account-numbers",
      {
        method: "POST",
        body: JSON.stringify(virtualAccountPayload),
      }
    );

    if (
      virtualAccountResponse.status === "success" &&
      virtualAccountResponse.data.status === "successful"
    ) {
      const newWallet: UserWallet = {
        userId,
        bvnReference,
        virtualAccountId: virtualAccountResponse.data.id,
        accountNumber: virtualAccountResponse.data.account_number,
        bankName: virtualAccountResponse.data.bank_name,
        balance: 0, // Initial balance, will be updated by webhooks or refresh
        kycStatus: "approved",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await db
        .collection("userWallets")
        .doc(userId)
        .set(newWallet, { merge: true });
      await db.collection("users").doc(userId).update({
        kycStatus: "approved",
        updatedAt: FieldValue.serverTimestamp(),
      });

      await logEvent(
        "INFO",
        "FLUTTERWAVE_SERVICE",
        "User wallet (virtual account) created and KYC approved",
        { userId, accountNumber: newWallet.accountNumber }
      );
      return {
        success: true,
        message: "KYC approved and wallet created.",
        wallet: newWallet,
      };
    } else {
      await db.collection("userWallets").doc(userId).update({
        kycStatus: "rejected",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await logEvent(
        "ERROR",
        "FLUTTERWAVE_SERVICE",
        "Failed to create virtual account after BVN verification",
        { userId, error: virtualAccountResponse.message }
      );
      return { success: false, message: "Failed to create virtual account." };
    }
  } catch (error: any) {
    await db.collection("userWallets").doc(userId).update({
      kycStatus: "rejected",
      updatedAt: FieldValue.serverTimestamp(),
    });
    await logEvent(
      "ERROR",
      "FLUTTERWAVE_SERVICE",
      "Exception during BVN consent callback handling",
      { userId, error: error.message }
    );
    return {
      success: false,
      message: "An unexpected error occurred during BVN verification.",
    };
  }
}

export async function getUserWallet(
  userId: string
): Promise<UserWallet | null> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const walletDocRef = db.collection("userWallets").doc(userId);
    const walletDoc = await walletDocRef.get();

    if (walletDoc.exists) {
      return walletDoc.data() as UserWallet;
    }

    return null;
  } catch (error) {
    await logEvent(
      "ERROR",
      "FLUTTERWAVE_SERVICE",
      "Error fetching user wallet",
      {
        userId,
        error: (error as Error).message,
      }
    );
    throw error;
  }
}

export async function refreshWalletBalance(userId: string): Promise<number> {
  const userWallet = await getUserWallet(userId);
  if (!userWallet?.accountNumber) {
    throw new Error("User wallet (virtual account) not found or incomplete.");
  }

  // Flutterwave virtual accounts don't have a direct "get balance" API.
  // Balance is typically managed via webhooks for incoming payments
  // or by querying transactions associated with the account.
  // For simplicity, we'll assume balance is updated via webhooks or
  // an internal ledger. If a direct API is found, it would go here.
  await logEvent(
    "INFO",
    "FLUTTERWAVE_SERVICE",
    "Balance refresh for virtual accounts is typically webhook-driven. Returning current stored balance.",
    { userId, currentBalance: userWallet.balance }
  );
  return userWallet.balance;
}

// --- TRANSACTIONS ---

export async function transferToEscrow(
  buyerUserId: string,
  dealId: string,
  amount: number,
  buyerEmail: string,
  buyerName: string,
  redirectUrl: string // URL for Flutterwave to redirect after payment
): Promise<{ success: boolean; message: string; redirect_url?: string }> {
  try {
    await logEvent(
      "INFO",
      "FLUTTERWAVE_SERVICE",
      "Initiating Flutterwave Standard payment for escrow funding",
      { buyerUserId, dealId, amount }
    );

    const txRef = `ESCROW-${dealId}-${buyerUserId}-${Date.now()}`; // Unique transaction reference

    const paymentPayload = {
      tx_ref: txRef,
      amount: amount,
      currency: "NGN", // Assuming NGN, adjust as needed
      redirect_url: redirectUrl,
      customer: {
        email: buyerEmail,
        name: buyerName,
        // phonenumber: buyerPhone, // Add if available
      },
      customizations: {
        title: "MountEscrow Deal Funding",
        description: `Funding for deal: ${dealId}`,
      },
      meta: {
        dealId: dealId,
        buyerId: buyerUserId,
      },
    };

    const response = await flutterwaveApiRequest("/v3/payments", {
      method: "POST",
      body: JSON.stringify(paymentPayload),
    });

    if (response.status === "success" && response.data?.link) {
      await logEvent(
        "INFO",
        "FLUTTERWAVE_SERVICE",
        "Flutterwave Standard payment initiated successfully",
        { dealId, buyerUserId, amount, redirectLink: response.data.link }
      );
      return {
        success: true,
        message: response.message,
        redirect_url: response.data.link,
      };
    } else {
      await logEvent(
        "ERROR",
        "FLUTTERWAVE_SERVICE",
        "Failed to initiate Flutterwave Standard payment",
        { dealId, buyerUserId, amount, error: response.message }
      );
      return {
        success: false,
        message: response.message || "Failed to initiate payment.",
      };
    }
  } catch (error: any) {
    await logEvent(
      "ERROR",
      "FLUTTERWAVE_SERVICE",
      "Exception during Flutterwave Standard payment initiation",
      {
        dealId,
        buyerUserId,
        amount,
        error: error.message,
      }
    );
    return {
      success: false,
      message: "An unexpected error occurred during payment initiation.",
    };
  }
}

export async function releaseFromEscrow(
  sellerUserId: string,
  dealId: string,
  milestoneTitle: string,
  amount: number,
  sellerBankDetails: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  }
): Promise<any> {
  const sellerWallet = await getUserWallet(sellerUserId);
  if (!sellerWallet) throw new Error("Seller wallet not found.");
  if (sellerWallet.kycStatus !== "approved")
    throw new Error("Seller KYC not approved.");

  try {
    const transferPayload = {
      account_bank: sellerBankDetails.bankCode,
      account_number: sellerBankDetails.accountNumber,
      amount: amount,
      currency: "NGN", // Assuming NGN
      narration: `Payment for ${milestoneTitle} (Deal: ${dealId})`,
      reference: `PAYOUT-${dealId}-${sellerUserId}-${Date.now()}`,
      callback_url: `https://www.mountescrow.com/api/flutterwave-webhook`, // Webhook to confirm transfer status
      beneficiary_name: sellerBankDetails.accountName,
      meta: {
        dealId: dealId,
        milestoneTitle: milestoneTitle,
        sellerId: sellerUserId,
      },
    };

    const response = await flutterwaveApiRequest("/v3/transfers", {
      method: "POST",
      body: JSON.stringify(transferPayload),
    });

    if (response.status === "success") {
      await db.collection("transactions").add({
        userId: sellerUserId,
        dealId,
        type: "MILESTONE_PAYMENT",
        amount,
        status: "PENDING", // Status is pending until webhook confirms
        description: `Payment for milestone: ${milestoneTitle}`,
        createdAt: FieldValue.serverTimestamp(),
        service: "Flutterwave",
        serviceRef: response.data?.reference || response.data?.id,
      });

      await logEvent(
        "INFO",
        "FLUTTERWAVE_SERVICE",
        "Successfully initiated transfer from escrow",
        {
          dealId,
          sellerUserId,
          amount,
          milestoneTitle,
          serviceRef: response.data?.reference || response.data?.id,
        }
      );
      return { success: true, message: response.message, data: response.data };
    } else {
      await logEvent(
        "ERROR",
        "FLUTTERWAVE_SERVICE",
        "Failed to initiate transfer from escrow",
        {
          dealId,
          sellerUserId,
          amount,
          error: response.message,
        }
      );
      throw new Error(`Release failed: ${response.message || "Unknown error"}`);
    }
  } catch (error) {
    await logEvent(
      "ERROR",
      "FLUTTERWAVE_SERVICE",
      "Exception during transfer from escrow",
      {
        dealId,
        sellerUserId,
        amount,
        error: (error as Error).message,
      }
    );
    throw error;
  }
}

export async function requestWithdrawal(
  userId: string,
  amount: number,
  bankDetails: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  }
): Promise<any> {
  const userWallet = await getUserWallet(userId);
  if (!userWallet) throw new Error("User wallet not found.");
  if (userWallet.kycStatus !== "approved")
    throw new Error("KYC not approved for withdrawal.");
  // Balance check against internal ledger (assuming you have one)
  // if (userWallet.balance < amount)
  //   throw new Error(`Insufficient balance. Available: $${userWallet.balance}, Required: $${amount}`);

  try {
    const withdrawalPayload = {
      account_bank: bankDetails.bankCode,
      account_number: bankDetails.accountNumber,
      amount: amount,
      currency: "NGN", // Assuming NGN
      narration: `Withdrawal request by user ${userId}`,
      reference: `WITHDRAWAL-${userId}-${Date.now()}`,
      callback_url: `https://www.mountescrow.com/api/flutterwave-webhook`, // Webhook to confirm transfer status
      beneficiary_name: bankDetails.accountName,
      meta: {
        userId: userId,
      },
    };

    const response = await flutterwaveApiRequest("/v3/transfers", {
      method: "POST",
      body: JSON.stringify(withdrawalPayload),
    });

    if (response.status === "success") {
      await db.collection("transactions").add({
        userId,
        type: "WITHDRAWAL",
        amount,
        status: "PENDING", // Status is pending until webhook confirms
        description: `Withdrawal to ${bankDetails.accountNumber}`,
        createdAt: FieldValue.serverTimestamp(),
        service: "Flutterwave",
        serviceRef: response.data?.reference || response.data?.id,
      });

      await logEvent(
        "INFO",
        "FLUTTERWAVE_SERVICE",
        "Successfully initiated withdrawal",
        {
          userId,
          amount,
          serviceRef: response.data?.reference || response.data?.id,
        }
      );
      return { success: true, message: response.message, data: response.data };
    } else {
      await logEvent(
        "ERROR",
        "FLUTTERWAVE_SERVICE",
        "Failed to initiate withdrawal",
        {
          userId,
          amount,
          error: response.message,
        }
      );
      throw new Error(
        `Withdrawal failed: ${response.message || "Unknown error"}`
      );
    }
  } catch (error) {
    await logEvent(
      "ERROR",
      "FLUTTERWAVE_SERVICE",
      "Exception during withdrawal",
      {
        userId,
        amount,
        error: (error as Error).message,
      }
    );
    throw error;
  }
}
