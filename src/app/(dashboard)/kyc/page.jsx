"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Wallet,
} from "lucide-react";

const kycFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  middleName: z.string().optional(),
  phone: z
    .string()
    .regex(/^(\+234|0)?[789]\d{9}$/, "Invalid Nigerian phone number"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  bvn: z.string().length(11, "BVN must be 11 digits"),
  gender: z.enum(["M", "F"]),
});

export default function KycPage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      phone: "",
      dob: "",
      bvn: "",
      gender: undefined,
    },
  });

  // Fetch user data from your API
  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/users/me");
      if (response.ok) {
        const data = await response.json();
        setUserData(data);

        // Pre-fill form with existing user data
        if (data?.displayName) {
          const parts = data.displayName.split(" ");
          form.setValue("firstName", parts[0] || "");
          form.setValue("middleName", parts.length > 2 ? parts[1] : "");
          form.setValue("lastName", parts[parts.length - 1] || "");
        }
        if (data?.phone) {
          form.setValue("phone", data.phone);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchUserData();
    }
  }, [user, authLoading, router]);

  const onSubmit = async (data) => {
    if (!user) return;

    setSubmitting(true);
    try {
      // Format phone for API call
      let formattedPhone = data.phone.replace(/[\s\-\(\)]/g, "");
      if (formattedPhone.startsWith("+234")) {
        formattedPhone = formattedPhone.substring(4);
      } else if (formattedPhone.startsWith("0")) {
        formattedPhone = formattedPhone.substring(1);
      }

      console.log("🚀 Submitting KYC with BVN:", data.bvn.slice(-4));

      // Call Express server BVN verification API via proxy
      const response = await fetch("/api/bvn-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bvn: data.bvn,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          phone: formattedPhone,
          gender: data.gender,
        }),
      });

      const result = await response.json();
      console.log("📨 API Response:", result);

      if (response.ok && result.success) {
        console.log("✅ BVN verified and validated");

        // Refresh auth context to get updated user data
        await refresh();

        // Refresh local user data
        await fetchUserData();

        toast({
          title: "KYC Verified ✅",
          description: "Your identity has been verified successfully!",
        });

        // Redirect to wallet
        setTimeout(() => {
          router.push("/wallet");
        }, 1000);
      } else {
        console.error("❌ Verification failed:", result.message);

        // Update KYC status to rejected via proxy
        try {
          await fetch("/api/users/kyc-status", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kycStatus: "rejected",
              rejectionReason: result.message || "BVN verification failed",
            }),
          });

          // Refresh data after status update
          await refresh();
          await fetchUserData();
        } catch (statusError) {
          console.error("Failed to update KYC status:", statusError);
        }

        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.errors
            ? result.errors.join(". ")
            : result.message ||
              "Unable to verify your BVN. Please check your details.",
        });
      }
    } catch (error) {
      console.error("❌ Submission error:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) return null;

  const status = userData?.kycStatus || "pending";

  const getIcon = () => {
    if (status === "approved")
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === "rejected")
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <Clock className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusMessage = () => {
    switch (status) {
      case "approved":
        return "Your KYC has been approved and your wallet is ready to use.";
      case "rejected":
        return userData?.rejectionReason
          ? `Your KYC was rejected: ${userData.rejectionReason}`
          : "Your KYC was rejected. Please review your information and submit again.";
      case "pending":
      default:
        return "Please complete your KYC verification to access wallet features.";
    }
  };

  if (status === "approved") {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>KYC Verification</CardTitle>
              <Badge className="flex items-center gap-2 bg-green-100 text-green-800">
                {getIcon()} Approved
              </Badge>
            </div>
            <CardDescription>{getStatusMessage()}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">KYC Approved!</h3>
              <p className="text-muted-foreground">
                Your identity has been verified and your wallet is ready to use.
              </p>
            </div>
            <Button asChild className="mt-4">
              <Link href="/wallet">
                <Wallet className="mr-2 h-4 w-4" />
                Access Wallet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Complete KYC Verification</CardTitle>
            <Badge
              variant={status === "rejected" ? "destructive" : "secondary"}
              className="flex items-center gap-2"
            >
              {getIcon()} {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
          <CardDescription>{getStatusMessage()}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "rejected" && userData?.rejectionReason && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Rejection Reason:</strong> {userData.rejectionReason}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  disabled={submitting}
                  placeholder="Enter your first name"
                />
                {form.formState.errors.firstName && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  disabled={submitting}
                  placeholder="Enter your last name"
                />
                {form.formState.errors.lastName && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="middleName">Middle Name (Optional)</Label>
              <Input
                id="middleName"
                {...form.register("middleName")}
                disabled={submitting}
                placeholder="Enter your middle name"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="+2348012345678 or 08012345678"
                disabled={submitting}
              />
              {form.formState.errors.phone && (
                <p className="text-red-600 text-sm mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                {...form.register("dob")}
                disabled={submitting}
              />
              {form.formState.errors.dob && (
                <p className="text-red-600 text-sm mt-1">
                  {form.formState.errors.dob.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="bvn">BVN (11 digits)</Label>
              <Input
                id="bvn"
                {...form.register("bvn")}
                maxLength={11}
                disabled={submitting}
                placeholder="Enter your 11-digit BVN"
              />
              {form.formState.errors.bvn && (
                <p className="text-red-600 text-sm mt-1">
                  {form.formState.errors.bvn.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Your BVN is used for identity verification and is kept secure.
              </p>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                onValueChange={(v) => form.setValue("gender", v)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.gender && (
                <p className="text-red-600 text-sm mt-1">
                  {form.formState.errors.gender.message}
                </p>
              )}
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
                  Verifying...
                </>
              ) : (
                "Submit KYC & Create Wallet"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
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
