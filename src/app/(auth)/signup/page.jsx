
import { SignUpForm } from './_components/signup-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
        <CardDescription>Enter your details to create your Mountescrow account and wallet.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
