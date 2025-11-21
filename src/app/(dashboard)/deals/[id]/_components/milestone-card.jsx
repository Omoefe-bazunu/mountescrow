"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveAndReleaseMilestone } from "@/services/deal.service";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  Send,
  ShieldAlert,
  Upload,
  XCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button as UIButton } from "@/components/ui/button";
import { SubmitWorkDialog } from "./submit-work-dialog";
import { RequestRevisionDialog } from "./request-revision-dialog";

export function MilestoneCard({
  milestone,
  milestoneIndex,
  dealId,
  isBuyer,
  isSeller,
  dealStatus,
  onUpdate,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const { toast } = useToast();

  const getStatusVariant = (status) => {
    switch (status) {
      case "Pending":
        return "outline";
      case "Funded":
        return "secondary";
      case "Submitted for Approval":
        return "default";
      case "Revision Requested":
        return "destructive";
      case "Completed":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Circle className="h-5 w-5 text-muted-foreground" />;
      case "Funded":
        return <Clock className="h-5 w-5 text-secondary-foreground" />;
      case "Submitted for Approval":
        return <Send className="h-5 w-5 text-primary-foreground" />;
      case "Revision Requested":
        return <ShieldAlert className="h-5 w-5 text-destructive-foreground" />;
      case "Completed":
        return <CheckCircle2 className="h-5 w-5 text-primary-foreground" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approveAndReleaseMilestone(dealId, milestoneIndex);
      toast({
        title: "Milestone Approved!",
        description: "Payment has been released to the seller's wallet.",
      });
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not approve milestone.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestRevision = async (reason) => {
    setIsProcessing(true);
    try {
      await requestMilestoneRevision(dealId, milestoneIndex, reason);
      toast({
        title: "Revision Requested",
        description: "The seller has been notified to revise their work.",
      });
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not request revision.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) {
      if (timestamp instanceof Date) return timestamp;
      return null;
    }
    return new Date(timestamp.seconds * 1000);
  };

  const dueDate = toDate(milestone.dueDate);

  const canSubmitWork =
    isSeller &&
    dealStatus === "In Progress" &&
    (milestone.status === "Funded" ||
      milestone.status === "Revision Requested");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between bg-muted/50 p-4">
        <div className="grid gap-0.5">
          <CardTitle className="text-xl flex items-center gap-3">
            Milestone {milestoneIndex + 1}: {milestone.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Due on {dueDate ? format(dueDate, "PPP") : "N/A"}
          </CardDescription>
        </div>
        <Badge
          variant={getStatusVariant(milestone.status)}
          className="flex items-center gap-2 text-sm px-3 py-1"
        >
          {getStatusIcon(milestone.status)}
          {milestone.status}
        </Badge>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <p className="text-muted-foreground flex items-start gap-2">
          <MessageSquare className="h-4 w-4 mt-1 shrink-0" />{" "}
          <span>{milestone.description}</span>
        </p>
        <div className="font-bold text-lg text-primary">
          ₦{milestone.amount.toFixed(2)}
        </div>

        {milestone.submission?.message && (
          <div className="p-4 bg-muted rounded-lg text-sm">
            <p className="font-semibold mb-2">Seller's Submission:</p>
            <p className="text-muted-foreground">
              {milestone.submission.message}
            </p>
            {milestone.submission.files &&
              milestone.submission.files.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium mb-2">Attached Files:</p>
                  <div className="space-y-1">
                    {milestone.submission.files.map((file, index) => (
                      <UIButton
                        key={index}
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-auto p-2 justify-start"
                      >
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-left"
                        >
                          <Upload className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{file.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </a>
                      </UIButton>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {milestone.revisionRequest?.message && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
            <p className="font-semibold mb-2 text-destructive">
              Buyer's Revision Request:
            </p>
            <p className="text-destructive/80">
              {milestone.revisionRequest.message}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/50 p-4 flex justify-end gap-2">
        {canSubmitWork && (
          <Button onClick={() => setIsSubmitting(true)} disabled={isProcessing}>
            <Upload className="mr-2 h-4 w-4" />
            {milestone.status === "Revision Requested"
              ? "Resubmit Work"
              : "Submit Work"}
          </Button>
        )}

        {isBuyer && milestone.status === "Submitted for Approval" && (
          <>
            <Button
              variant="destructive"
              onClick={() => setIsRevising(true)}
              disabled={isProcessing}
            >
              <XCircle className="mr-2 h-4 w-4" /> Request Revision
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Approve & Release Payment
            </Button>
          </>
        )}

        {milestone.status === "Revision Requested" && (
          <div className="w-full text-sm text-muted-foreground">
            <p>
              Need help? Contact support at{" "}
              <a
                href="mailto:support@mountescrow.com"
                className="text-primary underline"
              >
                support@mountescrow.com
              </a>
            </p>
          </div>
        )}
      </CardFooter>

      <SubmitWorkDialog
        isOpen={isSubmitting}
        onClose={() => setIsSubmitting(false)}
        dealId={dealId}
        milestoneIndex={milestoneIndex}
        onSuccess={onUpdate}
      />

      <RequestRevisionDialog
        isOpen={isRevising}
        onClose={() => setIsRevising(false)}
        dealId={dealId}
        milestoneIndex={milestoneIndex}
        onSuccess={onUpdate}
      />
    </Card>
  );
}
