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
import { AlertTriangle, Wallet, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MilestoneCard } from "./_components/milestone-card";
import { CountdownBanner } from "./_components/countdown-banner";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const formatNumber = (num) => {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

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
  const [hasOpenDispute, setHasOpenDispute] = useState(false);

  // Dispute modal
  const [open, setOpen] = useState(false);
  const [milestoneIndex, setMilestoneIndex] = useState("");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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
      const { deal } = await res.json();
      setDeal(deal);

      // Check for open dispute
      const checkRes = await fetch(`/api/disputes/check?dealId=${id}`, {
        credentials: "include",
      });
      if (checkRes.ok) {
        const { hasOpenDispute } = await checkRes.json();
        setHasOpenDispute(hasOpenDispute);
      }
    } catch (err) {
      console.error(err);
      setError("Deal not found or you don't have permission.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDeal();
    else if (!authLoading && !user) router.push("/login");
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
        className: "bg-white",
        description: "Funds deducted and seller notified.",
      });
      fetchDeal();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Funding Failed",
        className: "bg-white",
        description: e.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getEscrowFeePercentage = (amount) => {
    if (amount <= 1_000_000) return 0.1;
    if (amount <= 5_000_000) return 0.05;
    if (amount <= 50_000_000) return 0.04;
    if (amount <= 200_000_000) return 0.03;
    if (amount <= 1_000_000_000) return 0.02;
    return 0.01;
  };

  const handleRaiseDispute = async () => {
    if (!milestoneIndex || !reason.trim()) {
      toast({ variant: "destructive", title: "Required fields missing" });
      return;
    }

    setSubmitting(true);
    const form = new FormData();
    form.append("dealId", deal.id);
    form.append("projectTitle", deal.projectTitle);
    form.append("milestoneIndex", milestoneIndex);
    form.append("reason", reason);

    files.forEach((f) => form.append("files", f));

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed");

      toast({
        title: "Dispute raised",
        description: "Other party & admin notified.",
      });
      setOpen(false);
      setHasOpenDispute(true);
      setReason("");
      setFiles([]);
      setMilestoneIndex("");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed",
        className: "bg-white",
        description: e.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onMilestoneUpdate = () => fetchDeal();

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    let date;
    if (typeof ts === "string") date = new Date(ts);
    else if (ts.toDate) date = ts.toDate();
    else if (ts.seconds) date = new Date(ts.seconds * 1000);
    else date = new Date(ts);
    return isNaN(date) ? "N/A" : format(date, "PPP");
  };

  const completed =
    deal?.milestones.filter((m) => m.status === "Completed").length || 0;
  const total = deal?.milestones.length || 0;
  const progress = total ? (completed / total) * 100 : 0;

  const isBuyer =
    user && (user.uid === deal?.buyerId || user.email === deal?.buyerEmail);
  const isSeller = user?.email === deal?.sellerEmail;
  const canRaiseDispute =
    (isBuyer || isSeller) && deal?.status !== "Completed" && !hasOpenDispute;

  const getStatusVariant = (s) => {
    switch (s) {
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
    <div className="space-y-6 font-headline">
      {/* Deal Header */}
      <Card className="my-0 bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="font-headline font-semibold text-3xl">
                {deal.projectTitle}
              </CardTitle>
              <CardDescription className="mt-2">
                Created on {formatDate(deal.createdAt)}
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
              <span className="text-sm font-medium px-4">
                {completed} / {total} Completed
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardContent>
        {deal.milestones.some(
          (m) => m.countdownActive || m.countdownCancelledAt
        ) && (
          <div className="space-y-4">
            {deal.milestones.map(
              (milestone, i) =>
                (milestone.countdownActive ||
                  milestone.countdownCancelledAt) && (
                  <CountdownBanner
                    key={i}
                    milestone={milestone}
                    dealId={deal.id}
                    milestoneIndex={i}
                    isBuyer={isBuyer}
                    onUpdate={fetchDeal}
                  />
                )
            )}
          </div>
        )}

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
              {formatNumber(
                deal.totalAmount + deal.escrowFee * (deal.escrowFeePayer / 100)
              )}
              )
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Milestones */}
      <div className="space-y-4">
        {deal.milestones.map((milestone, i) => (
          <MilestoneCard
            key={i}
            milestone={milestone}
            dealId={deal.id}
            milestoneIndex={i}
            isBuyer={isBuyer}
            isSeller={isSeller}
            dealStatus={deal.status}
            onUpdate={onMilestoneUpdate}
          />
        ))}
      </div>

      {/* Raise Dispute Button */}
      {canRaiseDispute && (
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              onClick={() => setOpen(true)}
            >
              <AlertCircle className="mr-2 h-5 w-5" />
              Raise a Dispute
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="my-0 bg-white">
        <CardHeader>
          <CardTitle className="font-headline font-bold text-xl">
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Project Amount</span>
            <span className="font-medium">
              ₦{formatNumber(deal.totalAmount)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Escrow Fee (
                {(getEscrowFeePercentage(deal.totalAmount) * 100).toFixed(1)}%)
              </span>
              <span className="font-medium">
                ₦{formatNumber(deal.escrowFee / 1.075)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                VAT (7.5% of Escrow Fee)
              </span>
              <span>
                ₦{formatNumber(deal.escrowFee - deal.escrowFee / 1.075)}
              </span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t border-muted">
              <span>Total Escrow Fee (incl. VAT)</span>
              <span>₦{formatNumber(deal.escrowFee)}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground ml-4">
                • Buyer pays ({deal.escrowFeePayer}%)
              </span>
              <span className="font-medium">
                ₦{formatNumber(deal.escrowFee * (deal.escrowFeePayer / 100))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground ml-4">
                • Seller pays ({100 - deal.escrowFeePayer}%)
              </span>
              <span className="font-medium">
                ₦
                {formatNumber(
                  deal.escrowFee * ((100 - deal.escrowFeePayer) / 100)
                )}
              </span>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="flex justify-between font-bold text-lg">
            <span>Amount Buyer Must Fund</span>
            <span>
              ₦
              {formatNumber(
                deal.totalAmount + deal.escrowFee * (deal.escrowFeePayer / 100)
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Dispute Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Raise Dispute</DialogTitle>
            <DialogDescription>
              Report an issue with <strong>{deal.projectTitle}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Buyer:</strong> {deal.buyerEmail}
              </div>
              <div>
                <strong>Seller:</strong> {deal.sellerEmail}
              </div>
            </div>

            <div>
              <Label>Disputed Milestone</Label>
              <Select value={milestoneIndex} onValueChange={setMilestoneIndex}>
                <SelectTrigger>
                  <SelectValue placeholder="Select milestone" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {deal.milestones.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>
                      Milestone {i + 1}: {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description of the issue</Label>
              <Textarea
                placeholder="Explain what went wrong..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={6}
              />
            </div>

            <div>
              <Label>Attach proof (optional)</Label>
              <Input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRaiseDispute} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
