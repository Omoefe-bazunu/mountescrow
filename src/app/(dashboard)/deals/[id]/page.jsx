"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AlertTriangle, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MilestoneCard } from "./_components/milestone-card";
import { Progress } from "@/components/ui/progress";

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const id = params.id;
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDeal = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${id}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch deal");
      }
      const data = await res.json();
      setDeal(data.deal);
    } catch (err) {
      console.error("Error fetching deal:", err);
      setError("Deal not found or you don't have permission to view it.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDeal();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [id, user, authLoading, router]);

  const handleFundDeal = async () => {
    if (!deal) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}/fund`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Funding failed");
      }

      toast({
        title: "Deal Funded Successfully!",
        description: "Funds have been deducted and the seller notified.",
      });

      await fetchDeal(); // Refresh deal
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Funding Failed",
        description: error.message || "Could not fund the deal.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onMilestoneUpdate = () => {
    fetchDeal(); // Refresh on milestone changes
  };

  const toDate = (ts) => (ts?.seconds ? new Date(ts.seconds * 1000) : null);

  const completedMilestones =
    deal?.milestones.filter((m) => m.status === "Completed").length || 0;
  const totalMilestones = deal?.milestones.length || 0;
  const progressPercentage =
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const isBuyer =
    user && (user.uid === deal?.buyerId || user.email === deal?.buyerEmail);
  const isSeller = user?.email === deal?.sellerEmail;

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

  if (authLoading || loading) {
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

  if (!deal) return null;

  return (
    <div className="space-y-6">
      <Card className="my-0">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="font-headline font-semibold text-3xl">
                {deal.projectTitle}
              </CardTitle>
              <CardDescription className="mt-2">
                Created on{" "}
                {toDate(deal.createdAt)
                  ? format(toDate(deal.createdAt), "PPP")
                  : "N/A"}
              </CardDescription>
            </div>
            <Badge
              variant={getStatusVariant(deal.status)}
              className="text-base px-4 py-2"
            >
              {deal.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">
                {completedMilestones} / {totalMilestones} Completed
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </CardContent>

        {isBuyer && deal.status === "Awaiting Funding" && (
          <CardFooter>
            <Button
              onClick={handleFundDeal}
              disabled={isProcessing}
              className="w-full sm:w-auto ml-auto"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="mr-2 h-4 w-4" />
              )}
              Fund Deal Now (₦
              {(
                deal.totalAmount +
                deal.escrowFee * (deal.escrowFeePayer / 100)
              ).toFixed(2)}
              )
            </Button>
          </CardFooter>
        )}
      </Card>

      <div>
        <h3 className="text-xl font-semibold mb-4 font-headline">Milestones</h3>
        <div className="space-y-4">
          {deal.milestones.map((milestone, index) => (
            <MilestoneCard
              key={index}
              milestone={milestone}
              dealId={deal.id}
              milestoneIndex={index}
              isBuyer={isBuyer}
              isSeller={isSeller}
              dealStatus={deal.status}
              onUpdate={onMilestoneUpdate}
            />
          ))}
        </div>
      </div>

      <Card className="my-0">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Project Amount</span>
            <span className="font-medium">₦{deal.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Escrow Fee (Total)</span>
            <span className="font-medium">₦{deal.escrowFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground ml-4">
              • Buyer pays ({deal.escrowFeePayer}%)
            </span>
            <span className="font-medium">
              ₦{(deal.escrowFee * (deal.escrowFeePayer / 100)).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground ml-4">
              • Seller pays ({100 - deal.escrowFeePayer}%)
            </span>
            <span className="font-medium">
              ₦
              {(deal.escrowFee * ((100 - deal.escrowFeePayer) / 100)).toFixed(
                2
              )}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
            <span>Buyer Funds</span>
            <span>
              ₦
              {(
                deal.totalAmount +
                deal.escrowFee * (deal.escrowFeePayer / 100)
              ).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
