
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { submitMilestoneWork } from '@/services/deal.service';
import { FileUpload } from '@/components/ui/file-upload';

interface SubmitWorkDialogProps {
    isOpen: boolean;
    onClose: () => void;
    dealId: string;
    milestoneIndex: number;
    onSuccess: () => void;
}

const formSchema = z.object({
  message: z.string().min(1, 'A submission message is required.'),
  files: z.any().optional(),
});

export function SubmitWorkDialog({ isOpen, onClose, dealId, milestoneIndex, onSuccess }: SubmitWorkDialogProps) {
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { message: '' },
    });
    
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            await submitMilestoneWork(dealId, milestoneIndex, values.message, selectedFiles);
            toast({
                title: 'Work Submitted!',
                description: 'The buyer has been notified to review your submission.',
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error submitting work:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit work.' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit Milestone for Approval</DialogTitle>
                    <DialogDescription>
                        Provide a message and upload any relevant files for the buyer to review.
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
                                onFilesChange={setSelectedFiles}
                                maxFiles={5}
                                disabled={loading}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit for Approval
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

