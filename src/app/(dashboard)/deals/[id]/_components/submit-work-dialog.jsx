// src/app/(dashboard)/deals/[id]/_components/submit-work-dialog.jsx

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
import { FileUpload } from "@/components/ui/file-upload";

// Import the service function
import { submitMilestoneWork } from "@/services/deal.service";

const formSchema = z.object({
  message: z.string().min(1, "A submission message is required."),
});

export function SubmitWorkDialog({
  isOpen,
  onClose,
  dealId,
  milestoneIndex,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  const handleFilesChange = (files) => {
    setSelectedFiles(files);
  };

  async function onSubmit(values) {
    setLoading(true);
    try {
      // This will automatically handle submission AND countdown start
      const result = await submitMilestoneWork(
        dealId,
        milestoneIndex,
        values.message,
        selectedFiles.length > 0 ? selectedFiles : null
      );

      if (result.success) {
        if (result.countdownStarted) {
          toast({
            title: "✅ Work Submitted!",
            description: "Countdown timer started automatically.",
            className: "bg-white",
          });
        } else {
          toast({
            title: "⚠️ Work Submitted",
            description:
              "Countdown may not have started. Please check deal details to confirm.",
            variant: "warning",
            className: "bg-white",
          });
        }

        onSuccess();
        onClose();
        form.reset();
        setSelectedFiles([]);
      }
    } catch (error) {
      console.error("Error submitting work:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit work.",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    if (!loading) {
      form.reset();
      setSelectedFiles([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Milestone for Approval</DialogTitle>
          <DialogDescription>
            Provide a message and upload any relevant files for the buyer to
            review. A countdown timer will start automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Here is the work for this milestone..."
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Attach Files (Optional)</FormLabel>
              <FileUpload
                onFilesChange={handleFilesChange}
                maxFiles={5}
                maxSize={10 * 1024 * 1024} // 10MB
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Upload deliverables, screenshots, or documentation (max 5 files,
                10MB each)
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit & Start Countdown
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
