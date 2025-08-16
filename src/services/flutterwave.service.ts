import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getUserWallet, refreshFcmbWalletBalance } from "./fcmb.service";

export interface UserWallet {
  accountNumber: string;
  bankName: string;
  balance: number;
  kycStatus?: "pending" | "approved" | "rejected";
  updatedAt?: any;
}

// Re-export FCMB functions with Flutterwave naming for backward compatibility
export { getUserWallet, refreshFcmbWalletBalance as refreshWalletBalance };

// Mock functions for deal funding - these would need proper FCMB implementation
export async function transferToEscrow(
  buyerId: string,
  dealId: string,
  amount: number,
  buyerEmail: string,
  buyerName: string,
  redirectUrl: string
): Promise<{ success: boolean; message: string; redirect_url?: string }> {
  // This would integrate with FCMB payment gateway
  // For now, return a mock response
  console.log("Mock: Transfer to escrow", { buyerId, dealId, amount });
  
  return {
    success: true,
    message: "Payment initiated",
    redirect_url: `https://mock-payment-gateway.com/pay?amount=${amount}&redirect=${encodeURIComponent(redirectUrl)}`,
  };
}

export async function releaseFromEscrow(
  sellerId: string,
  dealId: string,
  milestoneTitle: string,
  amount: number,
  sellerBankDetails: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  }
): Promise<void> {
  // This would integrate with FCMB transfer API
  console.log("Mock: Release from escrow", { sellerId, dealId, amount });
  
  // Mock successful transfer - in real implementation, this would call FCMB API
  // and update wallet balance via webhook or direct API call
}