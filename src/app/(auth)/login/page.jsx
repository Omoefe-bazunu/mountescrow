import { LoginForm } from "./_components/login-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="mx-auto font-headline w-screen flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 ">
      <Card className="w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="text-center">
          <CardTitle className=" text-2xl font-semibold text-primary-blue">
            Welcome Back
          </CardTitle>
          <CardDescription>Log in to your Mountescrow account.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-secondary-blue">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary-blue hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
