"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CountdownBanner({
  milestone,
  dealId,
  milestoneIndex,
  isBuyer,
  onUpdate,
}) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!milestone.countdownActive || !milestone.countdownExpiresAt) {
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const expiresAt = new Date(milestone.countdownExpiresAt).getTime();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        setTimeLeft(null);
        // Trigger auto-approve
        handleAutoApprove();
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, remaining });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [milestone.countdownActive, milestone.countdownExpiresAt]);

  const handleAutoApprove = async () => {
    try {
      const response = await fetch(
        `/api/deals/${dealId}/milestones/${milestoneIndex}/auto-approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTO_APPROVE_SECRET || ""}`,
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Auto-approve failed:", error);
    }
  };

  const handleCancelCountdown = async () => {
    setCancelling(true);
    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((c) => c.startsWith("csrf-token="))
        ?.split("=")[1];

      const response = await fetch(
        `/api/deals/${dealId}/milestones/${milestoneIndex}/cancel-countdown`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken || "",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel countdown");
      }

      toast({
        title: "Countdown Paused",
        description: "Please review the milestone and take action.",
      });
      onUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel countdown",
      });
    } finally {
      setCancelling(false);
    }
  };

  // Show "on hold" state if countdown was cancelled
  if (milestone.countdownCancelledAt && !milestone.countdownActive) {
    return (
      <Alert className="border-amber-500 bg-amber-50 w-[90%] mx-auto mb-6 flex items-center">
        <Clock className="h-5 w-5 text-amber-600" />
        <AlertDescription className="ml-2 text-amber-900">
          <strong>Countdown on Hold.</strong> Kindly review the milestone and
          take the needed action for the seller.
        </AlertDescription>
      </Alert>
    );
  }

  // Don't show if countdown not active
  if (!milestone.countdownActive || !timeLeft) {
    return null;
  }

  return (
    <Alert className="border-blue-500 bg-blue-50 w-[90%] mx-auto mb-6 flex items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
          <AlertDescription className="text-blue-900">
            <strong>Auto-Approval Countdown:</strong>{" "}
            {timeLeft.hours > 0 && `${timeLeft.hours}h `}
            {timeLeft.minutes}m {timeLeft.seconds}s remaining
          </AlertDescription>
        </div>
        {isBuyer && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelCountdown}
            disabled={cancelling}
            className="border-blue-600 text-blue-600 hover:bg-blue-100"
          >
            {cancelling ? (
              "Cancelling..."
            ) : (
              <>
                <X className="h-4 w-4 mr-1" />
                Cancel Countdown
              </>
            )}
          </Button>
        )}
      </div>
    </Alert>
  );
}
