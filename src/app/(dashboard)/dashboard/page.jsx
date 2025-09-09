"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  or,
  and,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { user, wallet, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    activeDeals: 0,
    pendingProposals: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    if (!user || !user.email || !user.uid) return;
    setLoading(true);

    try {
      // --- Deals ---
      const buyerDealsQuery = query(
        collection(db, "deals"),
        where("buyerId", "==", user.uid),
        where("status", "in", ["Awaiting Funding", "In Progress"])
      );

      const sellerDealsQuery = query(
        collection(db, "deals"),
        where("sellerEmail", "==", user.email),
        where("status", "in", ["Awaiting Funding", "In Progress"])
      );

      const [buyerDealsSnap, sellerDealsSnap] = await Promise.all([
        getDocs(buyerDealsQuery),
        getDocs(sellerDealsQuery),
      ]);

      const deals = [
        ...buyerDealsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ...sellerDealsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      ];

      // Deduplicate deals
      const uniqueDeals = Object.values(
        deals.reduce((acc, d) => ({ ...acc, [d.id]: d }), {})
      );

      // --- Proposals ---
      const buyerProposalsQuery = query(
        collection(db, "proposals"),
        where("buyerEmail", "==", user.email)
      );

      const sellerProposalsQuery = query(
        collection(db, "proposals"),
        where("sellerEmail", "==", user.email)
      );

      const [buyerProposalsSnap, sellerProposalsSnap] = await Promise.all([
        getDocs(buyerProposalsQuery),
        getDocs(sellerProposalsQuery),
      ]);

      const proposals = [
        ...buyerProposalsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
        ...sellerProposalsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      ];

      // Deduplicate proposals
      const uniqueProposals = Object.values(
        proposals.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
      );

      // Count pending proposals
      let pendingProposalsCount = 0;
      uniqueProposals.forEach((proposal) => {
        if (
          proposal.sellerEmail === user.email &&
          proposal.status === "Pending"
        ) {
          pendingProposalsCount++;
        } else if (
          proposal.buyerEmail === user.email &&
          proposal.status === "AwaitingBuyerAcceptance"
        ) {
          pendingProposalsCount++;
        }
      });

      // --- Transactions ---
      const txQuery = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const txSnapshot = await getDocs(txQuery);
      const txData = txSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // --- Set state ---
      setStats({
        activeDeals: uniqueDeals.length,
        pendingProposals: pendingProposalsCount,
      });
      setTransactions(txData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTxTypeVariant = (type) => {
    switch (type) {
      case "DEPOSIT":
      case "MILESTONE_PAYMENT":
        return "default";
      case "WITHDRAWAL":
      case "ESCROW_FUNDING":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const toDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return null;
    return new Date(timestamp.seconds * 1000);
  };

  if (authLoading || loading) {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">
              Wallet Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline tracking-wider">
              $
              {wallet?.balance?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) ?? "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              {wallet?.updatedAt
                ? `Updated ${formatDistanceToNow(toDate(wallet.updatedAt))} ago`
                : "Available funds"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">
              Active Deals
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline tracking-wider">
              {stats.activeDeals}
            </div>
            <p className="text-xs text-muted-foreground">
              Deals awaiting funding or in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">
              Pending Proposals
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline tracking-wider">
              {stats.pendingProposals}
            </div>
            <p className="text-xs text-muted-foreground">
              Proposals awaiting your response
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle className="font-headline font-semibold text-xl">
              Recent Transactions
            </CardTitle>
            <CardDescription>Your last 5 transactions.</CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/transactions">
              View All <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="font-medium">{tx.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTxTypeVariant(tx.type)}>
                        {tx.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === "SUCCESS" ? "default" : "secondary"
                        }
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {toDate(tx.createdAt)
                        ? formatDistanceToNow(toDate(tx.createdAt)) + " ago"
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {["DEPOSIT", "MILESTONE_PAYMENT"].includes(tx.type)
                        ? "+"
                        : "-"}
                      ${tx.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No recent transactions found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
