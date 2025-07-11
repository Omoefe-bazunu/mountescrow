"use client";

import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo, useEffect } from 'react';
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { createProposal } from '@/services/proposal.service';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MailWarning } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUpload } from '@/components/ui/file-upload';

const milestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0.'),
  description: z.string().min(1, 'Milestone description is required.'),
  dueDate: z.date({ required_error: 'Due date is required.' }),
  files: z.any().optional(),
});

const formSchema = z.object({
  projectTitle: z.string().min(1, 'Project title is required.'),
  description: z.string().min(1, 'Project description is required.'),
  sellerEmail: z.string().email('Please enter a valid email for the seller.'),
  milestones: z.array(milestoneSchema).min(1, 'At least one milestone is required.'),
});

function getEscrowFeePercentage(amount: number): number {
  if (amount <= 1_000_000) return 0.10; // 5% + 5%
  if (amount <= 5_000_000) return 0.05; // 2.5% + 2.5%
  if (amount <= 50_000_000) return 0.04; // 2% + 2%
  if (amount <= 200_000_000) return 0.03; // 1.5% + 1.5%
  if (amount <= 1_000_000_000) return 0.02; // 1% + 1%
  return 0.01; // 0.5% + 0.5%
}

export function CreateProposalForm() {
  const [loading, setLoading] = useState(false);
  const [milestoneFiles, setMilestoneFiles] = useState<{ [key: number]: FileList | null }>({});
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectTitle: '',
      description: '',
      sellerEmail: '',
      milestones: [{ title: '', amount: 0, description: '', dueDate: new Date() }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'milestones',
  });

  const watchedMilestones = useWatch({
    control: form.control,
    name: 'milestones',
  });

  const { totalAmount, escrowFee } = useMemo(() => {
    const total = watchedMilestones.reduce((sum, milestone) => sum + (milestone.amount || 0), 0);
    const feePercentage = getEscrowFeePercentage(total);
    const fee = total * feePercentage;
    return { totalAmount: total, escrowFee: fee };
  }, [watchedMilestones]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await createProposal({ ...values, totalAmount, escrowFee, status: 'Pending' });
      toast({
        title: 'Proposal Sent!',
        description: 'Your proposal has been created and an invite has been sent to the seller.',
      });
      router.push('/proposals');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem creating your proposal. Please try again.',
      });
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!user?.emailVerified) {
    return (
      <Alert variant="destructive">
        <MailWarning className="h-4 w-4" />
        <AlertTitle>Action Required</AlertTitle>
        <AlertDescription>
          You must verify your email address before you can create proposals. Please check your inbox for a verification link.
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
                    <Input placeholder="e.g., Company Website Redesign" {...field} />
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
                    <Textarea placeholder="Provide a short summary of the project." {...field} />
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
                    <Input type="email" placeholder="seller@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-medium">Milestones</h3>
            {fields.map((field, index) => (
              <Card key={field.id} className="relative pt-2 my-0">
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`milestones.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Milestone Title</FormLabel>
                        <FormControl>
                          <Input placeholder={`Milestone ${index + 1}`} {...field} />
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
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1000" {...field} />
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
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
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
                          <Textarea placeholder="What will be delivered in this milestone?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>Supporting Files (Optional)</FormLabel>
                    <FileUpload
                      onFilesChange={(files) => {
                        setMilestoneFiles(prev => ({ ...prev, [index]: files }));
                        form.setValue(`milestones.${index}.files`, files);
                      }}
                      maxFiles={3}
                      disabled={loading}
                    />
                  </div>
                  {fields.length > 1 && (
                     <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                        className="absolute top-2 right-2 h-7 w-7 p-0"
                      >
                       <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Remove milestone</span>
                     </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => append({ title: '', amount: 0, description: '', dueDate: new Date() })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
        </div>

        <Card className="my-0">
            <CardHeader>
                <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-medium">${totalAmount.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Escrow Fee (2%)</span>
                    <span className="font-medium">${escrowFee.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between font-bold text-lg">
                    <span>You will pay</span>
                    <span className="text-muted-foreground">Escrow Fee ({(getEscrowFeePercentage(totalAmount) * 100).toFixed(1)}%)</span>
                </div>
            </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Invite
        </Button>
      </form>
    </Form>
  );
}