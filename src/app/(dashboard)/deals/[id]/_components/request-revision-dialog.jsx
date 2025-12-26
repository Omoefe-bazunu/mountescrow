"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { requestMilestoneRevision } from "@/services/deal.service";

const formSchema = z.object({
  message: z
    .string()
    .min(
      10,
      "Please provide a clear reason for the revision (min. 10 characters)."
    ),
});

export function RequestRevisionDialog({
  isOpen,
  onClose,
  dealId,
  milestoneIndex,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  async function onSubmit(values) {
    setLoading(true);
    try {
      // 1. Submit the milestone revision request [cite: 1827]
      await requestMilestoneRevision(dealId, milestoneIndex, values.message);

      // 2. Automatically stop the countdown [cite: 1848, 1850]
      const csrfToken = document.cookie
        .split("; ")
        .find((c) => c.startsWith("csrf-token="))
        ?.split("=")[1];

      await fetch(
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

      toast({
        title: "Revision Requested & Countdown Stopped",
        className: "bg-white",
        description:
          "The seller has been notified and the auto-approval timer has been paused.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error during revision request:", error);
      toast({
        variant: "destructive",
        className: "bg-white",
        title: "Error",
        description: "Failed to process the revision request.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Revision</DialogTitle>
          <DialogDescription>
            Explain what changes are needed for this milestone. This will be
            sent to the seller and stop the auto-approval timer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Revision</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., The logo colors are not matching the brand guidelines..."
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
