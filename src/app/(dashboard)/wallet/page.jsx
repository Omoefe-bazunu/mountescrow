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
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function WalletPage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [createAccountStatus, setCreateAccountStatus] = useState(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              setUserData(data);
              if (data.accountNumber) {
                setVirtualAccount({
                  virtualAccountNumber: data.accountNumber,
                  bankName: data.bankName || "FCMB",
                });
              }
            } else {
              setUserData(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error listening to user data:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Could not load user data.",
            });
            setLoading(false);
          }
        );

        fetchTransactions(currentUser.uid);

        return () => unsubscribeSnapshot();
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchTransactions = async (uid) => {
    setTransactionsLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch(`/api/wallet/transactions?uid=${uid}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      await fetchTransactions(user.uid);
      toast({
        title: "Refreshed",
        description: "Wallet data has been updated.",
      });
    } catch (error) {
      console.error("Refresh error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not refresh data.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkVirtualAccount = async () => {
    if (!user) return;
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch(
        `/api/virtual-account/check?uid=${user.uid}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            Accept: "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.virtualAccount) {
        setVirtualAccount(data.virtualAccount);
        setShowFundModal(true);
      } else if (userData?.accountNumber) {
        setVirtualAccount({
          virtualAccountNumber: userData.accountNumber,
          bankName: userData.bankName || "FCMB",
        });
        setShowFundModal(true);
      } else {
        setShowFundModal(true);
        setVirtualAccount(null);
      }
    } catch (error) {
      console.error("Error checking virtual account:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not check virtual account status.",
      });
      if (userData?.accountNumber) {
        setVirtualAccount({
          virtualAccountNumber: userData.accountNumber,
          bankName: userData.bankName || "FCMB",
        });
        setShowFundModal(true);
      } else {
        setShowFundModal(true);
        setVirtualAccount(null);
      }
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setIsCreatingAccount(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch("/api/virtual-account/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          uid: user.uid,
        }),
      });
      const data = await response.json();
      if (
        data.status === "SUCCESS" &&
        data.data?.successfulVirtualAccounts?.length > 0
      ) {
        const account = data.data.successfulVirtualAccounts[0];
        // Update Firestore with virtual account details
        await setDoc(
          doc(db, "users", user.uid),
          {
            accountNumber: account.virtualAccountNumber,
            bankName: "FCMB",
          },
          { merge: true }
        );
        setVirtualAccount({
          virtualAccountNumber: account.virtualAccountNumber,
          bankName: "FCMB",
        });
        setCreateAccountStatus("success");
        setShowCreateAccountModal(false);
        setShowFundModal(true);
      } else {
        setCreateAccountStatus("failed");
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to create virtual account.",
        });
        // Re-check in case account was created
        await checkVirtualAccount();
      }
    } catch (error) {
      console.error("Error creating virtual account:", error);
      setCreateAccountStatus("failed");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not create virtual account.",
      });
      // Re-check in case account was created
      await checkVirtualAccount();
    } finally {
      setIsCreatingAccount(false);
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const kycStatus = userData?.kycStatus || "pending";
  const walletBalance = Number(userData?.walletBalance) || 0;
  const accountNumber = userData?.accountNumber;
  const bankName = userData?.bankName || "FCMB";

  if (kycStatus !== "approved") {
    return (
      <Card className="my-0">
        <CardHeader>
          <CardTitle>KYC Verification Required</CardTitle>
          <CardDescription>
            Your KYC verification is {kycStatus}. Please complete KYC to access
            your wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/kyc")}>
            {kycStatus === "rejected" ? "Resubmit KYC" : "Complete KYC"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="my-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="font-headline text-2xl">Wallet</CardTitle>
              <CardDescription>
                Manage your funds and view transaction history.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="bg-green-500 rounded-lg py-1 px-4 text-center text-white">
                KYC Verified
              </div>
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
          <div className="bg-gray-50 text-primary-blue p-6 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm opacity-80">Available Balance</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary-foreground/20"
                  onClick={() => setBalanceVisible(!balanceVisible)}
                >
                  {balanceVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-4xl font-bold font-headline tracking-wider">
                {balanceVisible
                  ? `₦${walletBalance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "₦••••••"}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={checkVirtualAccount}
              >
                <ArrowDown className="mr-2 h-4 w-4" /> Fund
              </Button>
              <Button className="flex-1 bg-green-600">
                <ArrowUp className="mr-2 h-4 w-4" /> Withdraw
              </Button>
            </div>
          </div>

          {accountNumber && (
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="font-semibold mb-4">Your Funding Account</h3>
              <p className="text-sm text-secondary-blue mb-2">
                To deposit funds, transfer money to this account:
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded-md">
                  <span className="text-secondary-blue text-sm">
                    Account Number
                  </span>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono">{accountNumber}</strong>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(accountNumber)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-md">
                  <span className="text-secondary-blue text-sm">Bank Name</span>
                  <strong className="font-mono">{bankName} MFB</strong>
                </div>
              </div>
            </div>
          )}
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
                              : "secondary"
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
            <div className="text-center py-8 text-secondary-blue">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fund Wallet Modal */}
      <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Your Wallet</DialogTitle>
            <DialogDescription>
              {virtualAccount
                ? "Transfer money to this account to fund your wallet:"
                : "You need a virtual account to fund your wallet."}
            </DialogDescription>
          </DialogHeader>
          {virtualAccount ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-md">
                <span className="text-secondary-blue text-sm">
                  Account Number
                </span>
                <div className="flex items-center gap-2">
                  <strong className="font-mono">
                    {virtualAccount.virtualAccountNumber}
                  </strong>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() =>
                      copyToClipboard(virtualAccount.virtualAccountNumber)
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-md">
                <span className="text-secondary-blue text-sm">Bank Name</span>
                <strong className="font-mono">
                  {virtualAccount.bankName || "FCMB"} MFB
                </strong>
              </div>
            </div>
          ) : (
            <DialogFooter>
              <Button onClick={() => setShowCreateAccountModal(true)}>
                Create Virtual Account
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Virtual Account Modal */}
      <Dialog
        open={showCreateAccountModal}
        onOpenChange={setShowCreateAccountModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Virtual Account</DialogTitle>
            <DialogDescription>
              Fill in the details to create a virtual account for funding.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCreatingAccount}>
                {isCreatingAccount ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Creation Status Modal */}
      <Dialog
        open={createAccountStatus !== null}
        onOpenChange={() => setCreateAccountStatus(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createAccountStatus === "success"
                ? "Virtual Account Created"
                : "Failed to Create Account"}
            </DialogTitle>
            <DialogDescription>
              {createAccountStatus === "success"
                ? "Your virtual account has been successfully created."
                : "There was an error creating your virtual account. Please try again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setCreateAccountStatus(null);
                if (createAccountStatus === "success") {
                  setShowFundModal(true);
                }
              }}
            >
              {createAccountStatus === "success" ? "View Account" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
