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
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const searchMatch =
        searchTerm === "" ||
        (tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false);
      const typeMatch = typeFilter === "all" || tx.type === typeFilter;
      const statusMatch =
        statusFilter === "all" ||
        tx.status?.toLowerCase() === statusFilter.toLowerCase();
      return searchMatch && typeMatch && statusMatch;
    });
  }, [transactions, searchTerm, typeFilter, statusFilter]);

  const getTxTypeVariant = (type) => {
    switch (type) {
      case "credit":
      case "MILESTONE_PAYMENT":
        return "default";
      case "debit":
      case "WITHDRAWAL":
      case "ESCROW_FUNDING":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="my-0 font-headline bg-white border-t-4 border-t-primary-blue px-0 lg:px-4">
      <CardHeader>
        <CardTitle className="font-headline font-semibold text-2xl">
          Transactions
        </CardTitle>
        <CardDescription>
          View and filter your complete transaction history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 bg-muted rounded-lg">
          <Input
            placeholder="Search by description..."
            className="w-full lg:max-w-xs bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="credit">Deposit</SelectItem>
              <SelectItem value="debit">Withdrawal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
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
                    {tx.createdAt
                      ? format(new Date(tx.createdAt), "PPP")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTxTypeVariant(tx.type)}>
                      {tx.type === "credit" ? "Deposit" : "Withdrawal"}
                    </Badge>
                  </TableCell>
                  <TableCell>{tx.description || "Transaction"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.status?.toLowerCase() === "success" ||
                        tx.status?.toLowerCase() === "completed"
                          ? "default"
                          : tx.status?.toLowerCase() === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {tx.status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5 font-medium">
                      {tx.type === "credit" ||
                      tx.type === "DEPOSIT" ||
                      tx.type === "MILESTONE_PAYMENT" ||
                      tx.direction === "incoming" ? (
                        <>
                          <ArrowUp className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">
                            +₦
                            {Number(tx.amount || 0).toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">
                            -₦
                            {Number(tx.amount || 0).toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No transactions found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
