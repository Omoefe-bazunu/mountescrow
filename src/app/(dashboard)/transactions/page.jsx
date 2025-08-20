"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const txQuery = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const txSnapshot = await getDocs(txQuery);
      const txData = txSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(txData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const searchMatch =
        searchTerm === "" ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = typeFilter === "all" || tx.type === typeFilter;
      const statusMatch =
        statusFilter === "all" || tx.status.toLowerCase() === statusFilter;
      return searchMatch && typeMatch && statusMatch;
    });
  }, [transactions, searchTerm, typeFilter, statusFilter]);

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

  return (
    <Card className="my-0">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Transactions</CardTitle>
        <CardDescription>
          View and filter your complete transaction history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 p-4 bg-muted rounded-lg">
          <Input
            placeholder="Search by description..."
            className="max-w-xs bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="DEPOSIT">Deposit</SelectItem>
              <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
              <SelectItem value="ESCROW_FUNDING">Escrow Funding</SelectItem>
              <SelectItem value="MILESTONE_PAYMENT">
                Milestone Payment
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading || authLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredTransactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {toDate(tx.createdAt)
                      ? format(toDate(tx.createdAt), "PPP")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTxTypeVariant(tx.type)}>
                      {tx.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.status === "SUCCESS" ? "default" : "destructive"
                      }
                    >
                      {tx.status}
                    </Badge>
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
            <p>No transactions found for the selected filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
