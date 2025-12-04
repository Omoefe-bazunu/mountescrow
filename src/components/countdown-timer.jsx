// components/countdown-timer.jsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CountdownTimer({ dealId, milestoneIndex, isBuyer, onCancel }) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canCancel, setCanCancel] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const res = await fetch(
        `/api/deals/${dealId}/milestones/${milestoneIndex}/auto-approval-status`,
        { credentials: "include" }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.timeRemaining > 0) {
          setTimeRemaining(data.timeRemaining);
          setCanCancel(data.canCancel && isBuyer);
        } else {
          setTimeRemaining(0);
        }
        setCancelled(data.autoApprovalCancelled);
      }
    } catch (err) {
      console.error("Failed to fetch auto-approval status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [dealId, milestoneIndex, isBuyer]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCancel = async () => {
    if (!canCancel) return;

    const reason = prompt(
      "Please provide a reason for cancelling auto-approval:"
    );
    if (!reason) return;

    try {
      const res = await fetch(
        `/api/deals/${dealId}/milestones/${milestoneIndex}/cancel-auto-approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
          credentials: "include",
        }
      );

      if (res.ok) {
        setCancelled(true);
        toast({
          title: "Auto-approval cancelled",
          description: "Seller and admin have been notified.",
        });
        if (onCancel) onCancel();
      } else {
        throw new Error("Failed to cancel");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel auto-approval",
      });
    }
  };

  if (loading) return null;
  if (cancelled) return null;
  if (timeRemaining === null || timeRemaining <= 0) return null;

  const isUrgent = timeRemaining < 300; // Less than 5 minutes

  return (
    <Card
      className={`mb-4 ${isUrgent ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}
    >
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isUrgent ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : (
              <Clock className="h-5 w-5 text-blue-600" />
            )}
            <div>
              <p className="font-medium">
                ⏰ Auto-approval in:{" "}
                <span className="font-mono">{formatTime(timeRemaining)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {isBuyer
                  ? "Review now or it will auto-approve"
                  : "Buyer has 1 hour to review your submission"}
              </p>
            </div>
          </div>

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className={isUrgent ? "border-red-300 text-red-700" : ""}
            >
              Cancel Auto-Approval
            </Button>
          )}
        </div>

        {isUrgent && (
          <div className="mt-2 text-sm text-red-600">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Less than 5 minutes remaining! Take action now.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
