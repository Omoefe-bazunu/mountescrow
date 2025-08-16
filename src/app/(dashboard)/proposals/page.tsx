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
import { getProposals, ProposalData } from "@/services/proposal.service";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
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

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<({ id: string } & ProposalData)[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchProposals(currentUser);
      } else {
        setProposals([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProposals = async (currentUser: User) => {
    setLoading(true);
    try {
      const userProposals = await getProposals(currentUser);
      setProposals(userProposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "Accepted":
        return "default";
      case "Declined":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getRoleForProposal = (proposal: ProposalData) => {
    if (user?.uid === proposal.buyerId) return "Buyer";
    if (user?.email === proposal.sellerEmail) return "Seller";
    return "N/A";
  };

  return (
    <Card className="my-0 mx-auto w-full max-w-[100vw]">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="font-headline text-2xl">Proposals</CardTitle>
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
                {proposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{proposal.projectTitle}</span>
                        <span className="sm:hidden text-sm text-muted-foreground">
                          {user?.uid === proposal.buyerId
                            ? proposal.sellerEmail
                            : proposal.buyerEmail}
                        </span>
                        <span className="md:hidden sm:hidden text-sm text-muted-foreground">
                          {getRoleForProposal(proposal)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {user?.uid === proposal.buyerId
                        ? proposal.sellerEmail
                        : proposal.buyerEmail}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getRoleForProposal(proposal)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${(proposal.totalAmount + proposal.escrowFee).toFixed(2)}
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
                ))}
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
