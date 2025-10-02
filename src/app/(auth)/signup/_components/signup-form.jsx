"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions to create an account.",
  }),
});

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      acceptTerms: false,
    },
  });

  async function onSubmit(values) {
    setLoading(true);
    let user = null;

    try {
      const cleanPhone = values.phone.replace(/\s+/g, "");
      if (!/^\+?[\d\s-()]+$/.test(cleanPhone)) {
        throw new Error("Invalid phone number format");
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      user = userCredential.user;

      const displayName = `${values.firstName.trim()} ${values.lastName.trim()}`;
      await updateProfile(user, { displayName });

      const verificationToken = uuidv4().split("-")[0]; // short unique code

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: values.email,
        displayName,
        phone: cleanPhone,
        isVerified: false,
        verificationToken,
        tokenCreatedAt: new Date(),
        createdAt: new Date(),
        kycStatus: "pending",
        acceptedTerms: values.acceptTerms,
        termsAcceptedAt: new Date(),
      });

      // Fixed email sending with better error handling
      const emailResponse = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          firstName: values.firstName,
          verificationCode: verificationToken,
        }),
      });

      // Parse the response body
      const emailResult = await emailResponse.json();

      if (!emailResponse.ok) {
        console.error("Email API error:", emailResult);
        throw new Error(
          emailResult.error?.message ||
            emailResult.error ||
            "Failed to send verification email"
        );
      }

      toast({
        title: "Account created successfully!",
        description:
          "We've sent a verification code to your email. Please enter it to verify your account.",
      });

      await auth.signOut();
      router.push("/verify-account");
    } catch (error) {
      console.error("Signup error:", error);

      // Clean up user if created
      if (user) {
        try {
          await deleteUser(user);
          console.log("User deleted after signup error");
        } catch (deleteError) {
          console.error(
            "Failed to delete user after signup error:",
            deleteError
          );
        }
      }

      let errorMessage = "Something went wrong. Please try again.";

      // Handle Firebase auth errors
      if (error.code) {
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "This email is already registered.";
            break;
          case "auth/weak-password":
            errorMessage = "Password is too weak.";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address.";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else {
        errorMessage = error.message || errorMessage;
      }

      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+2348012345678 or 08012345678"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal">
                  I accept the{" "}
                  <Link
                    href="/policies"
                    className="text-primary underline hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms and Conditions
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !form.watch("acceptTerms")}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link
            href="/policies"
            className="text-primary underline hover:no-underline"
          >
            Terms and Conditions
          </Link>
        </div>
      </form>
    </Form>
  );
}
