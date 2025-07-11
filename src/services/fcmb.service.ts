"use server";

import { fcmbConfig } from "@/lib/config";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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

// --- AUTHENTICATION ---
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    if (!accessToken) {
      throw new Error("Access token is null");
    }
    if (!accessToken) {
      throw new Error("Access token is null");
    }
    if (!accessToken) {
      throw new Error("Access token is null");
    }
    return accessToken;
  }

  if (!fcmbConfig.clientId || !fcmbConfig.clientSecret || !fcmbConfig.authUrl) {
    throw new Error(
      "FCMB configuration is incomplete. Please check environment variables."
    );
  }

  try {
    console.log("Getting FCMB access token...", {
      authUrl: fcmbConfig.authUrl,
      clientId: fcmbConfig.clientId,
      hasSecret: !!fcmbConfig.clientSecret,
    });

    const body = new URLSearchParams({
      client_id: fcmbConfig.clientId,
      client_secret: fcmbConfig.clientSecret,
      grant_type: "client_credentials",
      scope: "profile",
    });

    const response = await fetch(fcmbConfig.authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });

    console.log("FCMB Auth Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("FCMB Auth Error Response:", errorText);
      throw new Error(`FCMB Auth Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("FCMB Auth Success:", {
      hasToken: !!data.access_token,
      expiresIn: data.expires_in,
    });

    if (!data.access_token) {
      throw new Error("No access token received from FCMB");
    }

    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // 5 min buffer

    await logEvent(
      "INFO",
      "FCMB_AUTH",
      "Successfully obtained FCMB access token."
    );
    return accessToken;
  } catch (error) {
    console.error("FCMB Auth Error:", error);
    await logEvent("ERROR", "FCMB_AUTH", "Failed to get FCMB access token", {
      error: (error as Error).message,
    });
    throw error;
  }
}

// --- API WRAPPER ---
async function fcmbApiRequest(endpoint: string, options: RequestInit = {}) {
  if (!fcmbConfig.apiBaseUrl) {
    throw new Error("FCMB API base URL is not configured");
  }

  const token = await getAccessToken();
  const url = `${fcmbConfig.apiBaseUrl}${endpoint}`;

  console.log("Making FCMB API Request:", {
    method: options.method || "GET",
    url,
    hasToken: !!token,
    hasBody: !!options.body,
  });

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...options.headers,
    },
  });

  console.log("FCMB API Response:", {
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
    console.error("FCMB API Error:", { status: response.status, errorData });
    await logEvent("ERROR", "FCMB_API", `API Request Failed on ${endpoint}`, {
      status: response.status,
      errorData,
    });
    throw new Error(
      `FCMB API Error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const responseData = await response.json();
  console.log("FCMB API Success:", {
    endpoint,
    responseKeys: Object.keys(responseData),
  });
  return responseData;
}

// --- WALLET & USER MANAGEMENT ---

export interface UserWallet {
  userId: string;
  walletAccountId: string;
  virtualAccountId: string;
  accountNumber: string;
  bankName: string;
  balance: number;
  tier: number;
  kycStatus: "pending" | "approved" | "rejected";
  createdAt: any;
  updatedAt: any;
}

export async function createWalletForUser(
  userId: string,
  userDetails: {
    bvn: string;
    firstName: string;
    lastName: string;
    phone: string;
    dob: string;
  }
): Promise<UserWallet> {
  try {
    console.log("Starting wallet creation for user:", userId);

    if (
      !userId ||
      !userDetails.bvn ||
      !userDetails.firstName ||
      !userDetails.lastName ||
      !userDetails.phone ||
      !userDetails.dob
    ) {
      throw new Error("Missing required user details for wallet creation");
    }
    if (!/^\d{11}$/.test(userDetails.bvn))
      throw new Error("BVN must be exactly 11 digits");

    // Sanitize and validate phone number to be exactly 10 digits as required by the API.
    // e.g., +2348012345678 -> 8012345678 or 08012345678 -> 8012345678
    let formattedPhone = userDetails.phone.replace(/[\s\-\(\)]/g, "");
    if (formattedPhone.startsWith("+234")) {
      formattedPhone = formattedPhone.substring(4);
    } else if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.substring(1);
    }

    if (!/^\d{10}$/.test(formattedPhone)) {
      throw new Error(
        "Invalid phone number format. It must resolve to 10 digits."
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(userDetails.dob))
      throw new Error("Date of birth must be in YYYY-MM-DD format");

    await logEvent(
      "INFO",
      "FCMB_SERVICE",
      "Starting wallet creation for user",
      { userId }
    );

    // Step 1: Create FCMB Tier 1 Wallet
    // The payload is structured to match the bank's working API example.
    // It uses a nested `id` object for the BVN.
    const walletPayload = {
      firstname: userDetails.firstName.trim(),
      lastname: userDetails.lastName.trim(),
      phone: formattedPhone,
      dob: userDetails.dob,
      id: {
        idNumber: userDetails.bvn,
        type: "BVN",
      },
    };

    // API Call 1: Create FCMB Tier 1 Wallet
    const walletResponse = await fcmbApiRequest("/wallet/create-tier-1", {
      method: "POST",
      body: JSON.stringify(walletPayload),
    });

    if (!walletResponse.success || !walletResponse.data?.id) {
      throw new Error(
        `Wallet creation failed: ${walletResponse.message || "Unknown error"}`
      );
    }
    const walletAccountId = walletResponse.data.id;

    // API Call 2: Create Virtual Account
    // Step 2: Create Virtual Account
    const virtualAccountPayload = {
      accountName: `${userDetails.firstName} ${userDetails.lastName}`.trim(),
      walletAccountId: walletAccountId,
    };

    const virtualAccountResponse = await fcmbApiRequest(
      "/virtual-account/static",
      {
        method: "POST",
        body: JSON.stringify(virtualAccountPayload),
      }
    );

    if (
      !virtualAccountResponse.success ||
      !virtualAccountResponse.data?.id ||
      !virtualAccountResponse.data?.accountNumber
    ) {
      throw new Error(
        `Virtual account creation failed: ${
          virtualAccountResponse.message || "Unknown error"
        }`
      );
    }

    const virtualAccountId = virtualAccountResponse.data.id;
    const accountNumber = virtualAccountResponse.data.accountNumber;
    const bankName = virtualAccountResponse.data.bankName || "FCMB";

    const newWallet: UserWallet = {
      userId,
      walletAccountId,
      virtualAccountId,
      accountNumber,
      bankName,
      balance: 0,
      tier: 1,
      kycStatus: "approved",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection("userWallets").doc(userId).set(newWallet);
    await logEvent(
      "INFO",
      "FCMB_SERVICE",
      "User wallet details saved to Firestore",
      { userId }
    );

    return newWallet;
  } catch (error: any) {
    await logEvent(
      "ERROR",
      "FCMB_SERVICE",
      "Failed to create wallet for user",
      { userId, error: error.message }
    );
    throw error;
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
    await logEvent("ERROR", "FCMB_SERVICE", "Error fetching user wallet", {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

export async function refreshWalletBalance(userId: string): Promise<number> {
  const userWallet = await getUserWallet(userId);
  if (!userWallet?.walletAccountId) {
    throw new Error("User wallet not found or incomplete.");
  }

  // For mock wallets, we don't call the API
  if (userWallet.walletAccountId.startsWith("mock_")) {
    await logEvent(
      "INFO",
      "FCMB_SERVICE",
      "Skipping balance refresh for mock wallet",
      { userId }
    );
    return userWallet.balance;
  }

  try {
    // API Call 3: Fetch wallet balance from FCMB
    const balanceResponse = await fcmbApiRequest(
      `/wallet/account?walletAccountId=${userWallet.walletAccountId}&details=true`
    );

    if (
      !balanceResponse.success ||
      typeof balanceResponse.data?.balance !== "number"
    ) {
      throw new Error(
        `Invalid balance response: ${
          balanceResponse.message || "Unknown error"
        }`
      );
    }

    const newBalance = balanceResponse.data.balance;

    await db.collection("userWallets").doc(userId).update({
      balance: newBalance,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await logEvent("INFO", "FCMB_SERVICE", "Wallet balance refreshed", {
      userId,
      newBalance,
    });
    return newBalance;
  } catch (error) {
    await logEvent(
      "ERROR",
      "FCMB_SERVICE",
      "Failed to refresh wallet balance",
      { userId, error: (error as Error).message }
    );
    throw error;
  }
}

// --- TRANSACTIONS ---

async function getEscrowWalletId(): Promise<string> {
  const escrowConfigRef = db.collection("config").doc("escrow");
  const escrowDoc = await escrowConfigRef.get();

  if (escrowDoc.exists && escrowDoc.data()?.walletAccountId) {
    return escrowDoc.data()!.walletAccountId;
  }

  await logEvent(
    "WARN",
    "FCMB_SERVICE",
    "Central escrow wallet not found. Creating new one."
  );

  try {
    // API Call 4: Create FCMB Tier 2 Wallet (if not exists)
    const walletResponse = await fcmbApiRequest("/wallet/create-tier-2", {
      method: "POST",
      body: JSON.stringify({ accountName: "MountEscrow Central Escrow" }),
    });

    if (!walletResponse.success || !walletResponse.data?.id) {
      throw new Error(
        `Failed to create central escrow wallet: ${
          walletResponse.message || "Unknown error"
        }`
      );
    }

    const walletAccountId = walletResponse.data.id;
    await escrowConfigRef.set({
      walletAccountId,
      createdAt: FieldValue.serverTimestamp(),
    });
    await logEvent("INFO", "FCMB_SERVICE", "Central escrow wallet created", {
      walletAccountId,
    });
    return walletAccountId;
  } catch (error) {
    await logEvent(
      "ERROR",
      "FCMB_SERVICE",
      "Failed to get/create escrow wallet",
      { error: (error as Error).message }
    );
    throw error;
  }
}

export async function transferToEscrow(
  buyerUserId: string,
  dealId: string,
  amount: number
): Promise<any> {
  const buyerWallet = await getUserWallet(buyerUserId);
  if (!buyerWallet) throw new Error("Buyer wallet not found.");
  if (buyerWallet.kycStatus !== "approved")
    throw new Error("Buyer KYC not approved.");
  if (buyerWallet.balance < amount)
    throw new Error(
      `Insufficient balance. Available: $${buyerWallet.balance}, Required: $${amount}`
    );

  const escrowWalletId = await getEscrowWalletId();

  try {
    const transferPayload = {
      fromWalletAccountId: buyerWallet.walletAccountId,
      toWalletAccountId: escrowWalletId,
      amount,
      narration: `Funding for Deal ID: ${dealId}`,
    };

    // API Call 5: Transfer funds from buyer's wallet to escrow wallet
    const response = await fcmbApiRequest("/wallet/transfer", {
      method: "POST",
      body: JSON.stringify(transferPayload),
    });

    if (!response.success)
      throw new Error(
        `Transfer failed: ${response.message || "Unknown error"}`
      );

    await refreshWalletBalance(buyerUserId);

    await db.collection("transactions").add({
      userId: buyerUserId,
      dealId,
      type: "ESCROW_FUNDING",
      amount,
      status: "SUCCESS",
      description: `Funded deal: ${dealId}`,
      createdAt: FieldValue.serverTimestamp(),
      service: "FCMB",
      serviceRef: response.data?.reference || response.data?.id,
    });

    return response;
  } catch (error) {
    await logEvent("ERROR", "FCMB_SERVICE", "Failed to transfer to escrow", {
      dealId,
      buyerUserId,
      amount,
      error: (error as Error).message,
    });
    throw error;
  }
}

export async function releaseFromEscrow(
  sellerUserId: string,
  dealId: string,
  milestoneTitle: string,
  amount: number
): Promise<any> {
  const sellerWallet = await getUserWallet(sellerUserId);
  if (!sellerWallet) throw new Error("Seller wallet not found.");
  if (sellerWallet.kycStatus !== "approved")
    throw new Error("Seller KYC not approved.");

  const escrowWalletId = await getEscrowWalletId();

  try {
    const transferPayload = {
      fromWalletAccountId: escrowWalletId,
      toWalletAccountId: sellerWallet.walletAccountId,
      amount,
      narration: `Payment for ${milestoneTitle} (Deal: ${dealId})`,
    };

    // API Call 6: Transfer funds from escrow wallet to seller's wallet
    const response = await fcmbApiRequest("/wallet/transfer", {
      method: "POST",
      body: JSON.stringify(transferPayload),
    });

    if (!response.success)
      throw new Error(`Release failed: ${response.message || "Unknown error"}`);

    await refreshWalletBalance(sellerUserId);

    await db.collection("transactions").add({
      userId: sellerUserId,
      dealId,
      type: "MILESTONE_PAYMENT",
      amount,
      status: "SUCCESS",
      description: `Payment for milestone: ${milestoneTitle}`,
      createdAt: FieldValue.serverTimestamp(),
      service: "FCMB",
      serviceRef: response.data?.reference || response.data?.id,
    });

    return response;
  } catch (error) {
    await logEvent("ERROR", "FCMB_SERVICE", "Failed to release from escrow", {
      dealId,
      sellerUserId,
      amount,
      error: (error as Error).message,
    });
    throw error;
  }
}

// --- WITHDRAWAL FUNCTIONALITY ---
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
  if (userWallet.balance < amount)
    throw new Error(
      `Insufficient balance. Available: $${userWallet.balance}, Required: $${amount}`
    );

  try {
    const withdrawalPayload = {
      fromWalletAccountId: userWallet.walletAccountId,
      amount,
      bankCode: bankDetails.bankCode,
      accountNumber: bankDetails.accountNumber,
      accountName: bankDetails.accountName,
      narration: `Withdrawal request by user ${userId}`,
    };

    // API Call 7: Initiate withdrawal from user's wallet to external bank account
    const response = await fcmbApiRequest("/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify(withdrawalPayload),
    });

    if (!response.success)
      throw new Error(
        `Withdrawal failed: ${response.message || "Unknown error"}`
      );

    await refreshWalletBalance(userId);

    await db.collection("transactions").add({
      userId,
      type: "WITHDRAWAL",
      amount,
      status: "SUCCESS",
      description: `Withdrawal to ${bankDetails.accountNumber}`,
      createdAt: FieldValue.serverTimestamp(),
      service: "FCMB",
      serviceRef: response.data?.reference || response.data?.id,
    });

    return response;
  } catch (error) {
    await logEvent("ERROR", "FCMB_SERVICE", "Failed to process withdrawal", {
      userId,
      amount,
      error: (error as Error).message,
    });
    throw error;
  }
}
