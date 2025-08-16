export interface UserWallet {
  accountNumber: string;
  bankName: string;
  balance: number;
  kycStatus?: "pending" | "approved" | "rejected";
  updatedAt?: any;
}
