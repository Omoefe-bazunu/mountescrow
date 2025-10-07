import { SignUpForm } from "./_components/signup-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="mx-auto w-screen flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 ">
      <Card className="w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="text-center">
          <CardTitle className="font-headline font-semibold text-primary-blue text-3xl">
            Create an Account
          </CardTitle>
          <CardDescription>
            Enter your details to create your Mountescrow account and wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
          <p className="mt-4 text-center text-sm text-secondary-blue">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary-blue hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
