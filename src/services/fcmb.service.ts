import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export interface UserWallet {
  accountNumber: string;
  bankName: string;
  balance: number;
  kycStatus?: "pending" | "approved" | "rejected";
  updatedAt?: any;
}
// Function to fetch FCMB Bearer token (reused from BVN verification logic)
async function getFcmbAccessToken(): Promise<string> {
  const clientId = process.env.FCMB_CLIENT_ID;
  const clientSecret = process.env.FCMB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("FCMB client credentials are not configured");
  }

  const response = await fetch(
    "https://baas.dev.getrova.co.uk/api/services/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "profile",
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Token fetch error:", errorData);
    throw new Error(errorData.message || "Failed to fetch access token");
  }

  const data = await response.json();
  return data.access_token;
}

// Function to create a Tier 1 wallet with BVN
export async function createFcmbWallet(
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    middleName?: string;
    phone: string;
    dob: string;
    bvn: string;
  }
): Promise<UserWallet> {
  try {
    const token = await getFcmbAccessToken();

    // Format phone number (remove +234 or leading 0)
    let formattedPhone = data.phone.replace(/[\s\-\(\)]/g, "");
    if (formattedPhone.startsWith("+234")) {
      formattedPhone = formattedPhone.substring(4);
    } else if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.substring(1);
    }

    // Prepare payload for wallet creation
    const payload: any = {
      firstname: data.firstName,
      lastname: data.lastName,
      phone: formattedPhone,
      dob: data.dob,
      id: {
        idNumber: data.bvn,
        type: "BVN",
      },
    };
    if (data.middleName) {
      payload.middlename = data.middleName; // Include middleName if provided
    }

    const response = await fetch(
      "https://baas.dev.getrova.co.uk/wallet/create-tier-1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Wallet creation error:", errorData);
      throw new Error(errorData.message || "Failed to create wallet");
    }

    const result = await response.json();
    
    // Create wallet object
    const wallet: UserWallet = {
      accountNumber: result.data.accountNumber || "Unknown",
      bankName: result.data.bankName || "FCMB",
      balance: result.data.balance || 0,
      kycStatus: "approved",
      updatedAt: serverTimestamp(),
    };

    // Store wallet in Firestore
    await setDoc(doc(db, "userWallets", userId), wallet);

    return wallet;
  } catch (error: any) {
    console.error("FCMB wallet creation error:", error);
    throw new Error(error.message || "Could not create wallet");
  }
}

// Function to refresh wallet balance
export async function refreshFcmbWalletBalance(
  userId: string,
  accountNumber: string
): Promise<number> {
  try {
    const token = await getFcmbAccessToken();

    const response = await fetch(
      `https://baas.dev.getrova.co.uk/wallet/${accountNumber}/summary`,
      {
        method: "GET",
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Balance refresh error:", errorData);
      throw new Error(errorData.message || "Failed to refresh balance");
    }

    const result = await response.json();
    const newBalance = result.data.balance || 0;
    
    // Update balance in Firestore
    await setDoc(doc(db, "userWallets", userId), {
      balance: newBalance,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return newBalance;
  } catch (error: any) {
    console.error("FCMB balance refresh error:", error);
    throw new Error(error.message || "Could not refresh balance");
  }
}

// Function to get user wallet from Firestore
export async function getUserWallet(userId: string): Promise<UserWallet | null> {
  try {
    const walletDoc = await getDoc(doc(db, "userWallets", userId));
    if (walletDoc.exists()) {
      return walletDoc.data() as UserWallet;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user wallet:", error);
    return null;
  }
}