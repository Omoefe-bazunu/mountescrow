"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ShieldAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const formatNumber = (num) => {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export default function DealsPage() {
  const { user, loading: authLoading } = useAuth();
  const [deals, setDeals] = useState([]);
  const [flaggedIds, setFlaggedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDeals();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      // Fetch both deals and the list of flagged IDs
      const [dealsRes, flaggedRes] = await Promise.all([
        fetch("/api/deals", { credentials: "include" }),
        fetch("/api/deals/flagged-ids", { credentials: "include" }).catch(
          () => null
        ),
      ]);

      if (!dealsRes.ok) throw new Error("Failed to fetch deals");

      const dealsData = await dealsRes.json();
      const flaggedData = flaggedRes
        ? await flaggedRes.json()
        : { flaggedIds: [] };

      setDeals(dealsData.deals || []);
      setFlaggedIds(flaggedData.flaggedIds || []);
    } catch (error) {
      console.error("Error fetching deals data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Awaiting Funding":
        return "secondary";
      case "In Progress":
        return "default";
      case "Completed":
        return "default";
      case "In Dispute":
        return "destructive";
      default:
        return "outline";
    }
  };

  const isBuyer = (deal) =>
    deal.buyerId === user?.uid || deal.buyerEmail === user?.email;

  if (authLoading || loading) {
    return (
      <Card className="my-0 bg-white">
        <CardHeader>
          <CardTitle className="font-headline font-semibold text-2xl">
            Deals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-0 bg-white font-headline">
      <CardHeader>
        <CardTitle className=" font-semibold text-2xl">Deals</CardTitle>
        <CardDescription>Track and manage your active deals.</CardDescription>
      </CardHeader>
      <CardContent>
        {deals.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Title</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right pr-4">Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => {
                const isSuspended = flaggedIds.includes(deal.id);

                return (
                  <TableRow
                    key={deal.id}
                    className={isSuspended ? "opacity-70 bg-slate-50/50" : ""}
                  >
                    <TableCell className="font-medium">
                      {deal.projectTitle}
                    </TableCell>
                    <TableCell>{isBuyer(deal) ? "Buyer" : "Seller"}</TableCell>
                    <TableCell className="text-right">
                      ₦{formatNumber(deal.totalAmount + (deal.escrowFee || 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSuspended ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldAlert className="h-3 w-3" /> Suspended
                        </Badge>
                      ) : (
                        <Badge variant={getStatusVariant(deal.status)}>
                          {deal.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSuspended ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive cursor-help"
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="left"
                              className="bg-white border-destructive text-destructive font-bold"
                            >
                              <p>
                                Transaction locked for review. Contact
                                admin@mountescrow.com
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/deals/${deal.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">No active deals yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Once a proposal is accepted, it will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
