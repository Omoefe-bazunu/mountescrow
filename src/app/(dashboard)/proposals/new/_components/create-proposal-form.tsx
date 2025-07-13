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
import {
  CalendarIcon,
  Loader2,
  PlusCircle,
  Trash2,
  MailWarning,
} from "lucide-react";
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
import {
  createProposal,
  type MilestoneData,
} from "@/services/proposal.service";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from "@/components/ui/file-upload";

const milestoneSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.date({ required_error: "Due date is required" }),
});

const formSchema = z.object({
  projectTitle: z.string().min(1, "Project title is required"),
  description: z.string().min(1, "Project description is required"),
  sellerEmail: z.string().email("Please enter a valid email"),
  milestones: z
    .array(milestoneSchema)
    .min(1, "At least one milestone is required"),
});

type FormData = z.infer<typeof formSchema>;

function getEscrowFeePercentage(amount: number): number {
  if (amount <= 1_000_000) return 0.1;
  if (amount <= 5_000_000) return 0.05;
  if (amount <= 50_000_000) return 0.04;
  if (amount <= 200_000_000) return 0.03;
  if (amount <= 1_000_000_000) return 0.02;
  return 0.01;
}

export function CreateProposalForm() {
  const [loading, setLoading] = useState(false);
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fallbackUser = auth.currentUser;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectTitle: "",
      description: "",
      sellerEmail: "",
      milestones: [
        {
          title: "",
          amount: 0,
          description: "",
          dueDate: new Date(),
        },
      ],
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

  const { totalAmount, escrowFee } = useMemo(() => {
    const total = watchedMilestones.reduce((sum, milestone) => {
      const amount = Number(milestone?.amount) || 0;
      return sum + amount;
    }, 0);
    const feePercentage = getEscrowFeePercentage(total);
    const fee = total * feePercentage;
    return { totalAmount: total, escrowFee: fee };
  }, [watchedMilestones]);

  const handleFilesChange = useCallback((files: File[]) => {
    setProjectFiles(files);
    setUploadError(null);
  }, []);

  const validateFiles = useCallback((): boolean => {
    if (projectFiles.length === 0) return true; // No files is valid

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    for (const file of projectFiles) {
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
  }, [projectFiles]);

  async function onSubmit(values: FormData) {
    if (!validateFiles()) {
      return;
    }

    setLoading(true);
    setUploadError(null);

    try {
      // Convert form milestones to the expected format
      const milestones: MilestoneData[] = values.milestones.map(
        (milestone) => ({
          title: milestone.title,
          amount: Number(milestone.amount),
          description: milestone.description,
          dueDate: milestone.dueDate,
        })
      );

      const proposalData = {
        projectTitle: values.projectTitle,
        description: values.description,
        sellerEmail: values.sellerEmail,
        milestones,
        totalAmount,
        escrowFee,
        status: "Pending" as const,
        files: projectFiles, // Pass files directly
      };

      await createProposal(proposalData);

      toast({
        title: "Proposal Sent!",
        description: "Your proposal has been created successfully.",
      });

      // Reset form and files
      form.reset();
      setProjectFiles([]);

      router.push("/proposals");
    } catch (error) {
      console.error("Error creating proposal:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create proposal. Please try again.";

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }

  const effectiveUser = user || fallbackUser;

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!effectiveUser?.emailVerified) {
    return (
      <Alert variant="destructive">
        <MailWarning className="h-4 w-4" />
        <AlertTitle>Action Required</AlertTitle>
        <AlertDescription>
          You must verify your email address before creating proposals.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

          <FormField
            control={form.control}
            name="sellerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seller's Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seller@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Project Files (Optional, Max 3)</FormLabel>
            <FileUpload
              onFilesChange={handleFilesChange}
              maxFiles={3}
              maxSize={5 * 1024 * 1024} // 5MB
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              disabled={loading}
            />
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Upload supporting documents (PDF, Word, or images, max 5MB each)
            </p>
          </div>
        </div>

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
                        <FormLabel>Amount ($)</FormLabel>
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
                          <PopoverContent className="w-auto p-0">
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

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Escrow Fee (
                {(getEscrowFeePercentage(totalAmount) * 100).toFixed(1)}%)
              </span>
              <span>${escrowFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-medium">
              <span>Total</span>
              <span>${(totalAmount + escrowFee).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Proposal...
            </>
          ) : (
            "Create Proposal"
          )}
        </Button>
      </form>
    </Form>
  );
}
