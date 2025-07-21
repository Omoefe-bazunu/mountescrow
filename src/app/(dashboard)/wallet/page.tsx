"use client";

import { useEffect, useState } from "react";
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
import { ArrowDown, ArrowUp, Copy, Loader2, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";
import {
  getUserWallet,
  UserWallet,
  refreshWalletBalance,
} from "@/services/flutterwave.service";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchWalletDetails = async (currentUser: User) => {
    setLoading(true);
    try {
      const userWallet = await getUserWallet(currentUser.uid);
      setWallet(userWallet);
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch wallet details.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchWalletDetails(currentUser);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleRefreshBalance = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const newBalance = await refreshWalletBalance(user.uid);
      setWallet((prev) => (prev ? { ...prev, balance: newBalance } : null));
      toast({
        title: "Balance Updated",
        description: `Your new balance is $${newBalance.toFixed(2)}`,
      });
    } catch (error) {
      console.error("Failed to refresh balance:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not refresh balance.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!", description: text });
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!wallet) {
    return (
      <Card className="my-0">
        <CardHeader>
          <CardTitle>Wallet Not Found</CardTitle>
          <CardDescription>
            We couldn't find a wallet associated with your account. This might
            be because your KYC is pending or was rejected. Please contact
            support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
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
              Refresh Balance
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="bg-primary text-primary-foreground p-6 rounded-lg flex flex-col justify-between">
            <div>
              <p className="text-sm opacity-80">Available Balance</p>
              <p className="text-4xl font-bold font-headline tracking-wider">
                ${wallet.balance.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="secondary">
                <ArrowUp className="mr-2 h-4 w-4" /> Withdraw Funds
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

      {/* Transaction history will be implemented in a future step */}
    </div>
  );
}
