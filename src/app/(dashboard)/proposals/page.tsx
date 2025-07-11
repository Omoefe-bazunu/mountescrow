
"use client";

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { getProposals, ProposalData } from "@/services/proposal.service";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

export default function ProposalsPage() {
    const [proposals, setProposals] = useState<({ id: string } & ProposalData)[]>([]);
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
            case 'Pending':
                return 'secondary';
            case 'Accepted':
                return 'default';
            case 'Declined':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getRoleForProposal = (proposal: ProposalData) => {
        if (user?.uid === proposal.buyerId) return 'Buyer';
        if (user?.email === proposal.sellerEmail) return 'Seller';
        return 'N/A';
    }

    return (
        <Card className="my-0">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-2xl">Proposals</CardTitle>
                        <CardDescription>Create and manage your transaction proposals.</CardDescription>
                    </div>
                    <Button asChild>
                        <Link href="/proposals/new">New Proposal</Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : proposals.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project Title</TableHead>
                                <TableHead>Other Party</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {proposals.map((proposal) => (
                                <TableRow key={proposal.id}>
                                    <TableCell className="font-medium">{proposal.projectTitle}</TableCell>
                                    <TableCell>{user?.uid === proposal.buyerId ? proposal.sellerEmail : proposal.buyerEmail}</TableCell>
                                    <TableCell>{getRoleForProposal(proposal)}</TableCell>
                                    <TableCell className="text-right">${(proposal.totalAmount + proposal.escrowFee).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(proposal.status)}>{proposal.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/proposals/${proposal.id}`}><ArrowRight className="h-4 w-4" /></Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
