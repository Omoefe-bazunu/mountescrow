"use client";

import { useForm } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  deleteUser,
  User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { createWalletForUser } from "@/services/fcmb.service";
import { doc, setDoc } from "firebase/firestore";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  bvn: z.string().length(11, "BVN must be 11 digits."),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format.")
    .refine((dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();
      if (isNaN(date.getTime())) return false;
      if (date > today) return false;
      const ageDifMs = Date.now() - date.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970) >= 18;
    }, "You must be at least 18 years old and date cannot be in the future."),
});

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      bvn: "",
      dob: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    let user: User | null = null;

    try {
      const cleanPhone = values.phone.replace(/\s+/g, "");
      if (!/^\+?[\d\s-()]+$/.test(cleanPhone)) {
        throw new Error("Invalid phone number format");
      }

      // 1. Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      user = userCredential.user;

      const displayName = `${values.firstName.trim()} ${values.lastName.trim()}`;
      await updateProfile(user, {
        displayName: displayName,
      });

      // 2. Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        phone: cleanPhone,
        createdAt: new Date(),
      });

      // 3. Create FCMB Wallet (This is our KYC step)
      await createWalletForUser(user.uid, {
        bvn: values.bvn,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: cleanPhone,
        dob: values.dob,
      });

      // 4. Send verification email
      await sendEmailVerification(user);

      toast({
        title: "Account created successfully!",
        description:
          "A verification link has been sent to your email. Please verify before logging in.",
      });

      await auth.signOut();
      router.push("/login");
    } catch (error: any) {
      console.error("Signup error:", error);

      if (user) {
        await deleteUser(user).catch((deleteError) => {
          console.error(
            "Failed to delete orphaned user after signup error:",
            deleteError
          );
        });
      }

      let errorMessage =
        "An unknown error occurred. Please check your details and try again.";
      if (error.message) {
        try {
          // Try parsing FCMB API error
          const apiError = JSON.parse(
            error.message.substring(error.message.indexOf("{"))
          );
          errorMessage =
            (apiError.messages &&
              Array.isArray(apiError.messages) &&
              apiError.messages.join(", ")) ||
            apiError.message || // Fallback for single message
            apiError.error_description ||
            "A bank service error occurred. Please verify your details or try again later.";
        } catch (e) {
          // Handle Firebase or other errors
          switch (error.code) {
            case "auth/email-already-in-use":
              errorMessage =
                "This email is already registered. Please use a different email or try logging in.";
              break;
            case "auth/weak-password":
              errorMessage =
                "Password is too weak. Please choose a stronger password.";
              break;
            default:
              errorMessage = error.message;
          }
        }
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
                <Input type="email" placeholder="raniem57@.com" {...field} />
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
        <div>
          <p className="">KYC Requirements - For secured transactions</p>
          <div className=" h-0.5 w-full bg-gray-100"></div>
        </div>
        <FormField
          control={form.control}
          name="bvn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Verification Number (BVN)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="11-digit BVN" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input type="text" placeholder="YYYY-MM-DD" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </Form>
  );
}
