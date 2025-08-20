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
      await requestMilestoneRevision(dealId, milestoneIndex, values.message);
      toast({
        title: "Revision Requested",
        description: "The seller has been notified to revise their work.",
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to request revision.",
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
            sent to the seller.
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
