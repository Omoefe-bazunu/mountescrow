
"use client";

"use client";

import { useEffect, useState } from 'react';
import { getDeals, DealData } from '@/services/deal.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function DealsPage() {
    const [deals, setDeals] = useState<({ id: string } & DealData)[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchDeals();
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const userDeals = await getDeals();
            setDeals(userDeals);
        } catch (error) {
            console.error("Error fetching deals:", error);
        } finally {
            setLoading(false);
        }
    };
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Awaiting Funding': return 'secondary';
            case 'In Progress': return 'default';
            case 'Completed': return 'default';
            case 'In Dispute': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <Card className="my-0">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Deals</CardTitle>
                <CardDescription>Track and manage your active deals.</CardDescription>
            </CardHeader>
            <CardContent>
                 {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : deals.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project Title</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deals.map((deal) => (
                                <TableRow key={deal.id}>
                                    <TableCell className="font-medium">{deal.projectTitle}</TableCell>
                                     <TableCell>
                                        {deal.buyerId === user?.uid ? 'Buyer' : 'Seller'}
                                     </TableCell>
                                    <TableCell className="text-right">${(deal.totalAmount + deal.escrowFee).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(deal.status)}>{deal.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/deals/${deal.id}`}><ArrowRight className="h-4 w-4" /></Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
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
