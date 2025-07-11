
"use client";

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProposalById, ProposalData, updateProposalStatus } from '@/services/proposal.service';
import { createDealFromProposal } from '@/services/deal.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Clock, DollarSign, FileText, User, Calendar, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [proposal, setProposal] = useState<({ id: string } & ProposalData) | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (id) {
      const fetchProposal = async () => {
        setLoading(true);
        setError(null);
        try {
          const fetchedProposal = await getProposalById(id);
          if (fetchedProposal) {
            setProposal(fetchedProposal);
          } else {
            setError("Proposal not found or you don't have permission to view it.");
          }
        } catch (err) {
          console.error("Error fetching proposal:", err);
          setError("An error occurred while fetching the proposal.");
        } finally {
          setLoading(false);
        }
      };
      fetchProposal();
    }
  }, [id]);
  
  const handleAccept = async () => {
    if (!proposal) return;
    setIsProcessing(true);
    try {
        await updateProposalStatus(proposal.id, 'Accepted');
        await createDealFromProposal(proposal);
        toast({
            title: 'Proposal Accepted!',
            description: 'A new deal has been created. The buyer will be notified to fund it.',
        });
        router.push('/deals');
    } catch (error) {
        console.error("Error accepting proposal:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not accept the proposal. Please try again.',
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
      if (!proposal) return;
      setIsProcessing(true);
      try {
        await updateProposalStatus(proposal.id, 'Declined');
        toast({
            title: 'Proposal Declined',
            description: 'The buyer will be notified of the rejection.',
        });
        router.push('/proposals');
      } catch (error) {
          console.error("Error declining proposal:", error);
          toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not decline the proposal. Please try again.',
          });
      } finally {
          setIsProcessing(false);
      }
  };


  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Accepted': return 'default';
      case 'Declined': return 'destructive';
      case 'Completed': return 'default';
      default: return 'outline';
    }
  };
  
  const toDate = (timestamp: any): Date | null => {
    if (!timestamp || !timestamp.seconds) return null;
    return new Date(timestamp.seconds * 1000);
  }
  
  const isSeller = currentUser?.email === proposal?.sellerEmail;
  const showActionButtons = isSeller && proposal?.status === 'Pending';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center my-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle /> Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!proposal) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="my-0">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="font-headline text-3xl">{proposal.projectTitle}</CardTitle>
                <CardDescription className="mt-2">Created on {toDate(proposal.createdAt) ? format(toDate(proposal.createdAt)!, 'PPP') : 'N/A'}</CardDescription>
              </div>
              <Badge variant={getStatusVariant(proposal.status)} className="text-base px-4 py-2">{proposal.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
            <div className="prose max-w-none text-muted-foreground">
                <p>{proposal.description}</p>
            </div>
             <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary"/>
                    <strong>Buyer:</strong>
                    <span>{proposal.buyerEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-accent"/>
                    <strong>Seller:</strong>
                    <span>{proposal.sellerEmail}</span>
                </div>
            </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-semibold mb-4 font-headline">Milestones</h3>
        <div className="space-y-4">
          {proposal.milestones.map((milestone, index) => (
            <Card key={index} className="my-0">
              <CardHeader>
                <CardTitle className="text-xl">{milestone.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-1 shrink-0"/> <span>{milestone.description}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <strong>Amount:</strong>
                    <span>${milestone.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <strong>Due Date:</strong>
                    <span>{toDate(milestone.dueDate) ? format(toDate(milestone.dueDate)!, 'PPP') : format(new Date(milestone.dueDate), 'PPP')}</span>
                  </div>
                </div>
                {milestone.files && (
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary"/>
                        <strong>Files:</strong> <span>{milestone.files.length} attached</span>
                    </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <Card className="my-0">
        <CardHeader>
            <CardTitle className="font-headline text-xl">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">${proposal.totalAmount.toFixed(2)}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Escrow Fee ({ (proposal.escrowFee / proposal.totalAmount * 100).toFixed(0) }%)</span>
                <span className="font-medium">${proposal.escrowFee.toFixed(2)}</span>
            </div>
             <div className="flex justify-between font-bold text-lg">
                <span>Total Payment</span>
                <span>${(proposal.totalAmount + proposal.escrowFee).toFixed(2)}</span>
            </div>
        </CardContent>
        {showActionButtons && (
            <CardFooter className="flex justify-end gap-2">
                <Button variant="destructive" onClick={handleDecline} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Decline
                </Button>
                <Button onClick={handleAccept} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Accept & Create Deal
                </Button>
            </CardFooter>
        )}
      </Card>

    </div>
  );
}
