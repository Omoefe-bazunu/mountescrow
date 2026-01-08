"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProposals } from "@/services/proposal.service.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const formatNumber = (num) => {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch proposals when user is loaded
  useEffect(() => {
    if (user) {
      fetchProposals();
    }
  }, [user]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const userProposals = await getProposals();
      userProposals.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || a.createdAt || 0;
        const dateB = b.createdAt?.toDate?.() || b.createdAt || 0;
        return dateB - dateA;
      });
      setProposals([...userProposals]);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "AwaitingBuyerAcceptance":
        return "secondary";
      case "Accepted":
        return "default";
      case "Declined":
        return "destructive";
      case "Completed":
        return "default";
      default:
        return "outline";
    }
  };

  const getRoleForProposal = (proposal) => {
    // Check if user is the buyer by ID or by Email
    if (user?.uid === proposal.buyerId || user?.email === proposal.buyerEmail)
      return "Buyer";
    if (user?.email === proposal.sellerEmail) return "Seller";
    return "N/A";
  };

  if (!user) {
    return (
      <Card className="my-0 mx-auto w-full max-w-[100vw]">
        <CardContent className="p-6">
          <div className="flex justify-center">
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-0 mx-auto font-headline bg-white w-full max-w-[100vw]">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="font-headline font-semibold text-2xl">
              Proposals
            </CardTitle>
            <CardDescription>
              Create and manage your transaction proposals.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/proposals/new">New Proposal</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : proposals.length > 0 ? (
          <div className="relative w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Project Title</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Other Party
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => {
                  const isUserBuyer =
                    user?.uid === proposal.buyerId ||
                    user?.email === proposal.buyerEmail;
                  return (
                    <TableRow key={proposal.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{proposal.projectTitle}</span>
                          <span className="sm:hidden text-sm text-muted-foreground">
                            {isUserBuyer
                              ? proposal.sellerEmail
                              : proposal.buyerEmail}
                          </span>
                          <span className="md:hidden sm:hidden text-sm text-muted-foreground">
                            {getRoleForProposal(proposal)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {isUserBuyer
                          ? proposal.sellerEmail
                          : proposal.buyerEmail}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getRoleForProposal(proposal)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₦
                        {formatNumber(
                          proposal.totalAmount + proposal.escrowFee
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(proposal.status)}>
                          {proposal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/proposals/${proposal.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">No proposals yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Get started by creating your first proposal.
            </p>
            <Button asChild>
              <Link href="/proposals/new">Create Proposal</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
