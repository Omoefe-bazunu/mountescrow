"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, Copy, Loader2, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const walletFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^\+?\d{10,13}$/, "Phone number must be 10-13 digits"),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  bvn: z.string().regex(/^\d{11}$/, "BVN must be exactly 11 digits"),
});

export default function WalletPage() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      dob: "",
      bvn: "",
    },
  });

  const fetchUserAndWalletDetails = async (currentUser) => {
    setLoading(true);
    try {
      const idToken = await currentUser.getIdToken(true);
      // Fetch user data to check KYC status
      const userResponse = await fetch(`/api/user?uid=${currentUser.uid}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          Accept: "application/json",
        },
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("User API response:", errorText);
        throw new Error("Failed to fetch user details");
      }

      const userData = await userResponse.json();
      setKycStatus(userData.kycStatus || "pending");

      // Fetch wallet details
      const walletResponse = await fetch(
        `/api/wallet/refresh-balance?uid=${currentUser.uid}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            Accept: "application/json",
          },
        }
      );

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWallet({
          accountNumber: walletData.accountNumber,
          bankName: walletData.bankName || "FCMB",
          balance: Number(walletData.balance) || 0,
        });
      } else if (walletResponse.status === 404) {
        setWallet(null);
      } else {
        const errorText = await walletResponse.text();
        console.error("Wallet API response:", errorText);
        throw new Error("Failed to fetch wallet details");
      }
    } catch (error) {
      console.error("Failed to fetch user or wallet:", error);
      setWallet(null);
      setKycStatus("pending");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not fetch user or wallet details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user || !wallet) return;
    setTransactionsLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch(`/api/wallet/transactions?uid=${user.uid}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not fetch transactions.",
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserAndWalletDetails(currentUser);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (wallet) {
      fetchTransactions();
    }
  }, [wallet]);

  const handleRefreshBalance = async () => {
    if (!user || !wallet) return;
    setIsRefreshing(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch(
        `/api/wallet/refresh-balance?uid=${user.uid}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to refresh balance");
      }

      const walletData = await response.json();
      setWallet((prev) => ({
        ...prev,
        balance: Number(walletData.balance) || 0,
      }));
      toast({
        title: "Balance Updated",
        description: `Your new balance is ₦${(Number(walletData.balance) || 0).toFixed(2)}`,
      });

      await fetchTransactions();
    } catch (error) {
      console.error("Refresh balance error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not refresh balance.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateWallet = async (data) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch("/api/wallet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          firstname: data.firstName,
          lastname: data.lastName,
          phone: data.phone,
          dob: data.dob,
          bvn: data.bvn,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create wallet");
      }

      const walletData = await response.json();
      setWallet({
        accountNumber: walletData.accountNumber,
        bankName: walletData.bankName || "FCMB",
        balance: Number(walletData.balance) || 0,
      });

      toast({
        title: "Wallet Created",
        description: `Your wallet (Account: ${walletData.accountNumber}) has been created.`,
      });

      setIsModalOpen(false);
      form.reset();
    } catch (error) {
      console.error("Wallet creation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not create wallet.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (kycStatus !== "approved") {
    return (
      <Card className="my-0">
        <CardHeader>
          <CardTitle>KYC Verification Required</CardTitle>
          <CardDescription>
            Your KYC verification is {kycStatus || "not started"}. Please
            complete KYC to create a wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>Complete KYC</Button>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card className="my-0">
        <CardHeader>
          <CardTitle>Wallet Not Found</CardTitle>
          <CardDescription>
            Create a wallet to manage your funds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsModalOpen(true)}>Create Wallet</Button>
        </CardContent>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Wallet</DialogTitle>
              <DialogDescription>
                Provide your details to create a wallet.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleCreateWallet)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  placeholder="Enter first name"
                />
                {form.formState.errors.firstName && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  placeholder="Enter last name"
                />
                {form.formState.errors.lastName && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="Enter phone number (e.g., +2341234567890)"
                />
                {form.formState.errors.phone && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  {...form.register("dob")}
                  placeholder="YYYY-MM-DD"
                />
                {form.formState.errors.dob && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.dob.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="bvn">BVN</Label>
                <Input
                  id="bvn"
                  {...form.register("bvn")}
                  placeholder="Enter 11-digit BVN"
                />
                {form.formState.errors.bvn && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.bvn.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Create Wallet"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Copied to clipboard.",
        });
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to copy to clipboard.",
        });
      });
  }

  return (
    <div className="space-y-6">
      <Card className="my-0">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-2xl">Wallet</CardTitle>
              <CardDescription>
                Manage your funds and view transaction history.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="default">KYC Verified</Badge>
              <Button
                onClick={handleRefreshBalance}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="bg-primary text-primary-foreground p-6 rounded-lg flex flex-col justify-between">
            <div>
              <p className="text-sm opacity-80">Available Balance</p>
              <p className="text-4xl font-bold font-headline tracking-wider">
                ₦
                {(Number(wallet.balance) || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" className="flex-1" disabled>
                <ArrowUp className="mr-2 h-4 w-4" /> Deposit
              </Button>
              <Button variant="secondary" className="flex-1" disabled>
                <ArrowDown className="mr-2 h-4 w-4" /> Withdraw
              </Button>
            </div>
          </div>
          <div className="bg-muted p-6 rounded-lg">
            <h3 className="font-semibold mb-4">Your Funding Account</h3>
            <p className="text-sm text-muted-foreground mb-2">
              To deposit funds, transfer money to this account:
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-md">
                <span className="text-muted-foreground text-sm">
                  Account Number
                </span>
                <div className="flex items-center gap-2">
                  <strong className="font-mono">{wallet.accountNumber}</strong>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(wallet.accountNumber)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-md">
                <span className="text-muted-foreground text-sm">Bank Name</span>
                <strong className="font-mono">{wallet.bankName}</strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent transactions on your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleString()}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell
                      className={
                        transaction.type === "credit"
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {transaction.type === "credit" ? "+" : "-"}₦
                      {(Number(transaction.amount) || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === "success"
                            ? "default"
                            : transaction.status === "failed"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
