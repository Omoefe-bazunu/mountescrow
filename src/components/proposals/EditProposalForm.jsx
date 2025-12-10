// components/proposals/EditProposalForm.jsx

"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useCallback } from "react";
import { CalendarIcon, Loader2, PlusCircle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { updateProposal } from "@/services/proposal.service";
import { FileUpload } from "@/components/ui/file-upload";
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

const milestoneSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.date({ required_error: "Due date is required" }),
});

const formSchema = z.object({
  projectTitle: z.string().min(1, "Project title is required"),
  description: z.string().min(1, "Project description is required"),
  escrowFeePayer: z.coerce.number().int().min(0).max(100),
  milestones: z
    .array(milestoneSchema)
    .min(1, "At least one milestone is required"),
});

function getEscrowFeePercentage(amount) {
  if (amount <= 1_000_000) return 0.1;
  if (amount <= 5_000_000) return 0.05;
  if (amount <= 50_000_000) return 0.04;
  if (amount <= 200_000_000) return 0.03;
  if (amount <= 1_000_000_000) return 0.02;
  return 0.01;
}

export function EditProposalForm({ proposal, proposalId }) {
  const [loading, setLoading] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState(proposal.files || []);
  const [removedFiles, setRemovedFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectTitle: proposal.projectTitle,
      description: proposal.description,
      escrowFeePayer: proposal.escrowFeePayer || 50,
      milestones: proposal.milestones.map((m) => ({
        ...m,
        amount: Number(m.amount),
        dueDate: m.dueDate?.toDate ? m.dueDate.toDate() : new Date(m.dueDate),
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "milestones",
  });

  const watchedMilestones = useWatch({
    control: form.control,
    name: "milestones",
  });
  const watchedEscrowFeePayer = useWatch({
    control: form.control,
    name: "escrowFeePayer",
  });

  const { totalAmount, escrowFee, escrowFeeWithVAT } = useMemo(() => {
    const total = watchedMilestones.reduce(
      (sum, m) => sum + (Number(m?.amount) || 0),
      0
    );
    const baseFee = total * getEscrowFeePercentage(total);
    const vat = baseFee * 0.075;
    const totalFee = baseFee + vat;

    return {
      totalAmount: total,
      escrowFee: baseFee,
      escrowFeeWithVAT: totalFee,
    };
  }, [watchedMilestones]);

  const buyerEscrowFeePortion = useMemo(() => {
    return escrowFeeWithVAT * (Number(watchedEscrowFeePayer) / 100);
  }, [escrowFeeWithVAT, watchedEscrowFeePayer]);

  const sellerEscrowFeePortion = useMemo(() => {
    return escrowFeeWithVAT * (1 - Number(watchedEscrowFeePayer) / 100);
  }, [escrowFeeWithVAT, watchedEscrowFeePayer]);

  const handleNewFilesChange = useCallback((files) => {
    setNewFiles(files);
    setUploadError(null);
  }, []);

  const handleRemoveExistingFile = useCallback((fileUrl) => {
    setExistingFiles((prev) => prev.filter((url) => url !== fileUrl));
    setRemovedFiles((prev) => [...prev, fileUrl]);
  }, []);

  const getFileNameFromUrl = (url) => {
    try {
      const urlParts = url.split("/");
      const fileNameWithParams = urlParts[urlParts.length - 1];
      const fileName = fileNameWithParams.split("?")[0];
      const cleanFileName = fileName.replace(/^\d+_\d+_/, "");
      return decodeURIComponent(cleanFileName);
    } catch {
      return "Unknown File";
    }
  };

  const validateFiles = useCallback(() => {
    const totalFiles = existingFiles.length + newFiles.length;
    if (totalFiles > 3) {
      setUploadError("Maximum 3 files allowed");
      return false;
    }

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    for (const file of newFiles) {
      if (file.size > maxSize) {
        setUploadError(`File "${file.name}" exceeds 5MB limit`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`File "${file.name}" has unsupported format`);
        return false;
      }
    }
    return true;
  }, [existingFiles, newFiles]);

  async function onSubmit(values) {
    if (!validateFiles()) return;

    setLoading(true);
    setUploadError(null);

    try {
      const milestones = values.milestones.map((milestone) => ({
        title: milestone.title,
        amount: Number(milestone.amount),
        description: milestone.description,
        dueDate: milestone.dueDate,
      }));

      await updateProposal(
        proposalId,
        {
          projectTitle: values.projectTitle,
          description: values.description,
          milestones,
          totalAmount,
          escrowFee: escrowFeeWithVAT,
          escrowFeePayer: Number(values.escrowFeePayer),
          removedFiles,
        },
        newFiles
      );

      toast({
        title: "Proposal Updated!",
        description: "Your proposal has been updated successfully.",
        className: "bg-white border-primary-blue",
      });

      router.push(`/proposals/${proposalId}`);
    } catch (error) {
      console.error("Error updating proposal:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update proposal.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 font-headline"
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="projectTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Website Redesign" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the project scope and requirements"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel className="block mb-2">Counterparty Email</FormLabel>
            <Input
              value={
                proposal.creatorRole === "buyer"
                  ? proposal.sellerEmail
                  : proposal.buyerEmail
              }
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Cannot be changed after proposal creation
            </p>
          </div>

          <FormField
            control={form.control}
            name="escrowFeePayer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Who pays the escrow fee?</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={String(field.value)}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee payment split" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    <SelectItem value="100">Buyer pays 100%</SelectItem>
                    <SelectItem value="75">
                      Buyer pays 75%, Seller pays 25%
                    </SelectItem>
                    <SelectItem value="50">
                      Buyer pays 50%, Seller pays 50%
                    </SelectItem>
                    <SelectItem value="25">
                      Buyer pays 25%, Seller pays 75%
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Project Files (Max 3 total)</FormLabel>

            {existingFiles.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-muted-foreground">
                  Existing files ({existingFiles.length}):
                </p>
                {existingFiles.map((fileUrl) => (
                  <div
                    key={fileUrl}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span className="text-sm truncate flex-1">
                      {getFileNameFromUrl(fileUrl)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExistingFile(fileUrl)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <FileUpload
              onFilesChange={handleNewFilesChange}
              maxFiles={3 - existingFiles.length}
              maxSize={5 * 1024 * 1024}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              disabled={loading}
            />
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {existingFiles.length + newFiles.length}/3 files (max 5MB each)
            </p>
          </div>
        </div>

        {/* Milestones section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Milestones</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  title: "",
                  amount: 0,
                  description: "",
                  dueDate: new Date(),
                })
              }
              disabled={loading}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardContent className="pt-6 space-y-4">
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="absolute right-2 top-2 text-destructive"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <FormField
                  control={form.control}
                  name={`milestones.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Milestone {index + 1}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Design Phase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`milestones.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₦)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`milestones.${index}.dueDate`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={loading}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Select date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto bg-white border-primary-blue p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`milestones.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe deliverables for this milestone"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">₦{formatNumber(totalAmount)}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Escrow Fee (
                  {(getEscrowFeePercentage(totalAmount) * 100).toFixed(1)}%)
                </span>
                <span>₦{formatNumber(escrowFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  VAT (7.5% of Escrow Fee)
                </span>
                <span>₦{formatNumber(escrowFeeWithVAT - escrowFee)}</span>
              </div>
              <div className="flex justify-between font-medium pt-1 border-t border-muted">
                <span>Total Escrow Fee (incl. VAT)</span>
                <span>₦{formatNumber(escrowFeeWithVAT)}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground ml-4">
                  • Buyer pays ({watchedEscrowFeePayer}%)
                </span>
                <span className="font-medium">
                  ₦{formatNumber(buyerEscrowFeePortion)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground ml-4">
                  • Seller pays ({100 - watchedEscrowFeePayer}%)
                </span>
                <span className="font-medium">
                  ₦{formatNumber(sellerEscrowFeePortion)}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-bold text-lg">
              <span>Project Value (Excl. Escrow Fee)</span>
              <span>₦{formatNumber(totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Proposal"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
