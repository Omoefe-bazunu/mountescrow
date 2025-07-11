import { CreateProposalForm } from './_components/create-proposal-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NewProposalPage() {
  return (
    <Card className="my-0">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Create New Proposal</CardTitle>
        <CardDescription>Fill in the details below to create a new transaction proposal.</CardDescription>
      </CardHeader>
      <CardContent>
        <CreateProposalForm />
      </CardContent>
    </Card>
  );
}
