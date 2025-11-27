"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { format } from "date-fns";
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
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    activeDeals: 0,
    pendingProposals: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    if (!user?.email && !user?.uid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/data", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      setStats({
        activeDeals: data.activeDeals || 0,
        pendingProposals: data.pendingProposals || 0,
      });
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
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

  const toDate = (input) => {
    if (!input) return null;

    try {
      if (input.seconds) {
        return new Date(input.seconds * 1000);
      }
      if (input._seconds) {
        // Firestore timestamp format
        return new Date(input._seconds * 1000);
      }
      if (typeof input === "string" || typeof input === "number") {
        return new Date(input);
      }
      return null;
    } catch (error) {
      console.error("Date conversion error:", error);
      return null;
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96 mt-8" />
      </>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">Please log in to view dashboard.</div>
    );
  }

  return (
    <>
      <div className="grid font-headline md:grid-cols-2 lg:grid-cols-3 space-y-4 md:space-y-0 md:gap-8 mb-4">
        <Card className="bg-primary-blue text-white my-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-xl font-semibold">Wallet Balance</div>
            <p> ₦</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">
              ₦
              {user?.walletBalance?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) ?? "0.00"}
            </div>
            <p className="text-xs opacity-90 mt-2">Available funds</p>
          </CardContent>
        </Card>

        <Card className="bg-green-600 text-white my-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-xl font-semibold">Active Deals</div>
            <Package className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">
              {stats.activeDeals}
            </div>
            <p className="text-xs opacity-90">
              In progress or awaiting funding
            </p>
          </CardContent>
        </Card>

        <Card className="bg-accent-blue text-white my-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-xl font-semibold">Pending Proposals</div>
            <FileText className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">
              {stats.pendingProposals}
            </div>
            <p className="text-xs opacity-90">Awaiting your response</p>
          </CardContent>
        </Card>
      </div>

      <Card className="font-headline bg-white">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle className="font-headline text-primary-blue font-semibold text-xl">
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
                    <TableCell className="font-medium">
                      {tx.description}
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
                        ? format(toDate(tx.createdAt), "PPP")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {["DEPOSIT", "MILESTONE_PAYMENT"].includes(tx.type)
                        ? "+"
                        : "-"}
                      ₦{tx.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No recent transactions.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
