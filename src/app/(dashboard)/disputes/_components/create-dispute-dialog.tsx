"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createDispute } from '@/services/dispute.service';
import { FileUpload } from '@/components/ui/file-upload';

interface CreateDisputeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dealId?: string;
  dealTitle?: string;
  otherPartyEmail?: string;
}

const formSchema = z.object({
  dealId: z.string().min(1, 'Deal ID is required'),
  dealTitle: z.string().min(1, 'Deal title is required'),
  disputedAgainst: z.string().email('Valid email is required'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(20, 'Please provide a detailed description (min. 20 characters)'),
  category: z.enum(['milestone_quality', 'payment_delay', 'communication', 'contract_breach', 'other']),
  priority: z.enum(['low', 'medium', 'high']),
});

export function CreateDisputeDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  dealId = '', 
  dealTitle = '', 
  otherPartyEmail = '' 
}: CreateDisputeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<FileList | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dealId,
      dealTitle,
      disputedAgainst: otherPartyEmail,
      subject: '',
      description: '',
      category: 'other',
      priority: 'medium',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await createDispute({
        ...values,
        evidence: {
          files: [], // Will be implemented with file upload
          screenshots: [],
          messages: [],
        },
      });
      
      toast({
        title: 'Dispute Filed Successfully',
        description: 'Your dispute has been submitted. Our team will review it and contact you soon.',
      });
      
      onSuccess();
      onClose();
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to file dispute. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  const categoryOptions = [
    { value: 'milestone_quality', label: 'Milestone Quality Issues' },
    { value: 'payment_delay', label: 'Payment Delays' },
    { value: 'communication', label: 'Communication Problems' },
    { value: 'contract_breach', label: 'Contract Breach' },
    { value: 'other', label: 'Other' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>File a Dispute</DialogTitle>
          <DialogDescription>
            Please provide detailed information about your dispute. Our team will review and respond within 24-48 hours.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="dealTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter deal title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="disputedAgainst"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Party Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="other.party@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
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

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>

            <FormField
              control={form.control}
              name="description"
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

            <div className="space-y-2">
              <FormLabel>Evidence (Optional)</FormLabel>
              <FileUpload
                onFilesChange={setEvidenceFiles}
                maxFiles={10}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Upload screenshots, documents, or other evidence to support your dispute.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
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