"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { createDispute } from "@/services/dispute.service";
import { FileUpload } from "@/components/ui/file-upload";

const formSchema = z.object({
  dealId: z.string().min(1, "Deal ID is required"),
  reason: z
    .string()
    .min(20, "Please provide a detailed description (min. 20 characters)"),
  priority: z.enum(["low", "medium", "high"]),
});

export function CreateDisputeDialog({
  isOpen,
  onClose,
  onSuccess,
  dealId = "",
  dealTitle = "",
  otherPartyEmail = "",
}) {
  const [loading, setLoading] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dealId,
      reason: "",
      priority: "medium",
    },
  });

  async function onSubmit(values) {
    setLoading(true);
    try {
      await createDispute(values.dealId, values.reason);
      toast({
        title: "Dispute Filed Successfully",
        description:
          "Your dispute has been submitted. Our team will review it and contact you soon.",
      });
      onSuccess();
      onClose();
      form.reset();
      setEvidenceFiles([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error?.message || "Failed to file dispute. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>File a Dispute</DialogTitle>
          <DialogDescription>
            Please provide detailed information about your dispute. Our team
            will review and respond within 24-48 hours.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dealId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter deal ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a detailed explanation of the issue, including timeline, specific problems, and what resolution you're seeking..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Evidence (Optional)</FormLabel>
              <FileUpload
                onFilesChange={setEvidenceFiles}
                maxFiles={10}
                maxSize={10 * 1024 * 1024} // 10MB
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Upload screenshots, documents, or other evidence to support your
                dispute (max 10 files, 10MB each).
              </p>
            </div>

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
                File Dispute
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
