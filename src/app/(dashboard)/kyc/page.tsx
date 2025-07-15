"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { createWalletForUser } from "@/services/fcmb.service";

const kycFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z
    .string()
    .regex(
      /^(\+234|0)?[789]\d{9}$/,
      "Please enter a valid Nigerian phone number"
    ),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  bvn: z.string().regex(/^\d{11}$/, "BVN must be exactly 11 digits"),
});

type KycFormData = z.infer<typeof kycFormSchema>;

interface UserData {
  kycStatus?: "pending" | "approved" | "rejected";
  displayName?: string;
  email?: string;
}

export default function KycPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<KycFormData>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      dob: "",
      bvn: "",
    },
  });

  const fetchUserData = async (currentUser: User) => {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);

        // Pre-fill form with existing data if available
        if (data.displayName) {
          const nameParts = data.displayName.split(" ");
          form.setValue("firstName", nameParts[0] || "");
          form.setValue("lastName", nameParts.slice(1).join(" ") || "");
        }
      } else {
        setUserData({ kycStatus: "pending" });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const onSubmit = async (data: KycFormData) => {
    if (!user) return;

    setSubmitting(true);
    try {
      // Format phone number for API
      let formattedPhone = data.phone.replace(/[\s\-\(\)]/g, "");
      if (formattedPhone.startsWith("+234")) {
        formattedPhone = formattedPhone.substring(4);
      } else if (formattedPhone.startsWith("0")) {
        formattedPhone = formattedPhone.substring(1);
      }

      const userDetails = {
        bvn: data.bvn,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: formattedPhone,
        dob: data.dob,
      };

      await createWalletForUser(user.uid, userDetails);

      toast({
        title: "KYC Completed Successfully!",
        description:
          "Your wallet has been created and KYC approved. You can now access your wallet.",
      });

      // Refresh user data to show updated status
      await fetchUserData(user);
    } catch (error: any) {
      console.error("KYC submission error:", error);

      let toastDescription = "Please check your details and try again.";
      let specificErrorMessage = null;

      // Attempt to parse the JSON part of the error message
      if (error.message && typeof error.message === "string") {
        const jsonStartIndex = error.message.indexOf("{");
        if (jsonStartIndex !== -1) {
          const jsonString = error.message.substring(jsonStartIndex);
          try {
            const errorJson = JSON.parse(jsonString);
            if (
              errorJson.messages &&
              Array.isArray(errorJson.messages) &&
              errorJson.messages.length > 0
            ) {
              specificErrorMessage = errorJson.messages[0];
            }
          } catch (parseError) {
            // JSON parsing failed, fall through to check for known string patterns
            console.warn("Failed to parse error message JSON:", parseError);
          }
        }
      }

      if (specificErrorMessage) {
        toastDescription = specificErrorMessage;
      } else if (error.message && typeof error.message === "string") {
        // Fallback to checking for known string patterns if JSON parsing didn't yield a specific message
        if (
          error.message.includes(
            "names provided do not match the ones on the BVN record"
          )
        ) {
          toastDescription =
            "The names provided do not match your BVN record. Please ensure your first and last names are exact matches.";
        } else if (error.message.includes("Invalid phone number format")) {
          toastDescription =
            "Invalid phone number format. It must resolve to 10 digits (e.g., 08012345678).";
        } else if (error.message.includes("BVN must be exactly 11 digits")) {
          toastDescription = "BVN must be exactly 11 digits.";
        } else if (
          error.message.includes("Date of birth must be in YYYY-MM-DD format")
        ) {
          toastDescription = "Date of birth must be in YYYY-MM-DD format.";
        } else {
          toastDescription = error.message; // Final fallback to the raw error message
        }
      }

      toast({
        variant: "destructive",
        title: "KYC Submission Failed",
        description: toastDescription,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "pending":
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default" as const;
      case "rejected":
        return "destructive" as const;
      case "pending":
      default:
        return "secondary" as const;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "approved":
        return "Your KYC has been approved and your wallet is ready to use.";
      case "rejected":
        return "Your KYC was rejected. Please review your information and submit again.";
      case "pending":
      default:
        return "Please complete your KYC verification to access wallet features.";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const kycStatus = userData?.kycStatus || "pending";

  return (
    <div className="space-y-6">
      <Card className="my-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl">
                KYC Verification
              </CardTitle>
              <CardDescription>
                Complete your Know Your Customer verification to access wallet
                features
              </CardDescription>
            </div>
            <Badge
              variant={getStatusVariant(kycStatus)}
              className="flex items-center gap-2"
            >
              {getStatusIcon(kycStatus)}
              {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert
            className={
              kycStatus === "approved" ? "border-green-200 bg-green-50" : ""
            }
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{getStatusMessage(kycStatus)}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {kycStatus === "approved" ? (
        <Card className="my-0">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">KYC Approved!</h3>
                <p className="text-muted-foreground">
                  Your identity has been verified and your wallet is ready to
                  use.
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link href="/wallet">
                  <Wallet className="mr-2 h-4 w-4" />
                  Access Wallet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="my-0">
          <CardHeader>
            <CardTitle>Complete KYC Verification</CardTitle>
            <CardDescription>
              {kycStatus === "rejected"
                ? "Please review and correct your information below"
                : "Provide your personal information to verify your identity"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    {...form.register("firstName")}
                    disabled={submitting}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    {...form.register("lastName")}
                    disabled={submitting}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g., +2348012345678 or 08012345678"
                  {...form.register("phone")}
                  disabled={submitting}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  {...form.register("dob")}
                  disabled={submitting}
                />
                {form.formState.errors.dob && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.dob.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
                <Input
                  id="bvn"
                  placeholder="Enter your 11-digit BVN"
                  maxLength={11}
                  {...form.register("bvn")}
                  disabled={submitting}
                />
                {form.formState.errors.bvn && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.bvn.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Your BVN is used for identity verification and is kept secure.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing KYC...
                  </>
                ) : (
                  <>
                    Submit KYC & Create Wallet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="my-0">
        <CardHeader>
          <CardTitle className="text-lg">
            Why do we need this information?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            • <strong>Identity Verification:</strong> We verify your identity to
            comply with financial regulations
          </p>
          <p>
            • <strong>Security:</strong> KYC helps protect your account and
            prevent fraud
          </p>
          <p>
            • <strong>Wallet Creation:</strong> A verified identity is required
            to create your secure wallet
          </p>
          <p>
            • <strong>Compliance:</strong> We follow banking regulations to
            ensure safe transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
