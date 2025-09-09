import axios from "axios";
import { db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function createFcmbWallet(userId, data) {
  try {
    // 1. Get FCMB API token
    const token = await getFcmbToken();

    // 2. Format phone number
    const formattedPhone = formatPhoneNumber(data.phone);

    // 3. Build payload
    const payload = {
      firstname: data.firstname,
      lastname: data.lastname,
      phone: formattedPhone,
      dob: data.dob,
      id: {
        idNumber: data.bvn,
        type: "BVN",
      },
    };

    // 4. Call FCMB API
    const response = await axios.post(
      "https://baas-api.getrova.io/wallet/create-tier-1",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
        timeout: 15000,
        validateStatus: (status) => status >= 200 && status < 300,
      }
    );

    if (
      response.data.status !== "SUCCESS" ||
      !response.data.data?.accountNumber
    ) {
      throw new Error(
        `FCMB API error: ${response.data.message || "Invalid response"}`
      );
    }

    // 5. Build wallet object
    const wallet = {
      accountNumber: response.data.data.accountNumber,
      bankName: "FCMB",
      balance: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 6. Save in Firestore
    await setDoc(doc(db, "wallets", userId), wallet);

    return wallet;
  } catch (error) {
    console.error("FCMB wallet creation failed:", error);
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data || { message: error.message };
      throw new Error(`FCMB API error: ${JSON.stringify(apiError)}`);
    }
    throw new Error(`Wallet creation failed: ${error.message}`);
  }
}

export async function refreshFcmbWalletBalance(userId, accountNumber) {
  try {
    const token = await getFcmbToken();

    const response = await axios.get(
      `https://baas.dev.getrova.co.uk/wallet/${accountNumber}/summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
        timeout: 15000,
        validateStatus: (status) => status >= 200 && status < 300,
      }
    );

    if (response.data.status !== "SUCCESS") {
      throw new Error(
        `FCMB balance error: ${response.data.message || "Invalid response"}`
      );
    }

    const balance = Number(response.data.data?.availableBalance) || 0;
    if (isNaN(balance) || balance < 0) {
      console.warn("Invalid or negative balance detected:", balance);
      throw new Error("Invalid balance returned from FCMB API");
    }

    // Update Firestore wallet doc
    const walletRef = doc(db, "wallets", userId);
    await setDoc(
      walletRef,
      {
        balance,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return balance;
  } catch (error) {
    console.error("Failed to refresh FCMB wallet balance:", error);
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data || { message: error.message };
      throw new Error(`FCMB API error: ${JSON.stringify(apiError)}`);
    }
    throw new Error(`Balance refresh failed: ${error.message}`);
  }
}

async function getFcmbToken() {
  try {
    const clientId = process.env.FCMB_CLIENT_ID;
    const clientSecret = process.env.FCMB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("FCMB credentials not configured");
    }

    const response = await axios.post(
      "https://baas.dev.getrova.co.uk/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "profile",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "*/*",
        },
        timeout: 10000,
        validateStatus: (status) => status >= 200 && status < 300,
      }
    );

    if (!response.data.access_token) {
      throw new Error("Missing access token in FCMB token response");
    }

    return response.data.access_token;
  } catch (error) {
    console.error("Failed to get FCMB token:", error);
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data || { message: error.message };
      throw new Error(`FCMB token error: ${JSON.stringify(apiError)}`);
    }
    throw new Error(`Token fetch failed: ${error.message}`);
  }
}

function formatPhoneNumber(phone) {
  let formatted = phone.replace(/[\s\-\(\)]/g, "");
  if (formatted.startsWith("+234")) {
    formatted = formatted.substring(4);
  } else if (formatted.startsWith("0")) {
    formatted = formatted.substring(1);
  }
  if (!/^\d{10}$/.test(formatted)) {
    throw new Error("Phone number must be 10 digits");
  }
  return formatted;
}
