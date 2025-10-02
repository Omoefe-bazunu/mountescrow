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
import { doc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletPage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Real-time listener for user data
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
          <div className="bg-gray-50 text-primary p-6 rounded-lg flex flex-col justify-between">
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
              <Button variant="secondary" className="flex-1">
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
              <p className="text-sm text-muted-foreground mb-2">
                To deposit funds, transfer money to this account:
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded-md">
                  <span className="text-muted-foreground text-sm">
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
                  <span className="text-muted-foreground text-sm">
                    Bank Name
                  </span>
                  <strong className="font-mono">{bankName}</strong>
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
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
