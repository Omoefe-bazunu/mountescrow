"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
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
  gender: z.enum(["M", "F"], { required_error: "Please select a gender" }),
});

// Helper: reads the csrf-token cookie on the client side
function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

// Thin fetch wrapper that automatically attaches the CSRF header
async function apiFetch(url, options = {}) {
  const csrfToken = getCsrfToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...(options.headers || {}),
    },
  });
}

export default function KycPage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
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

  const fetchUserData = async () => {
    try {
      const response = await apiFetch("/api/users/me");
      if (response.ok) {
        const data = await response.json();
        setUserData(data);

        if (data?.displayName) {
          const parts = data.displayName.trim().split(" ");
          setValue("firstName", parts[0] || "");
          setValue("middleName", parts.length > 2 ? parts[1] : "");
          setValue("lastName", parts[parts.length - 1] || "");
        }
        if (data?.phone) setValue("phone", data.phone);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) fetchUserData();
  }, [user, authLoading]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      let formattedPhone = data.phone.replace(/[\s\-\(\)]/g, "");
      if (formattedPhone.startsWith("+234"))
        formattedPhone = formattedPhone.substring(4);
      else if (formattedPhone.startsWith("0"))
        formattedPhone = formattedPhone.substring(1);

      const response = await apiFetch("/api/bvn-verification", {
        method: "POST",
        body: JSON.stringify({
          bvn: data.bvn,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName || "",
          phone: formattedPhone,
          dob: data.dob,
          gender: data.gender,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await refresh();
        await fetchUserData();

        toast({
          title: "KYC Verified ✅",
          description: "Your identity has been verified successfully!",
          className: "bg-white border border-primary-blue",
        });

        setTimeout(() => router.push("/wallet"), 1000);
      } else {
        // Mark as rejected on the backend
        try {
          await apiFetch("/api/users/kyc-status", {
            method: "PATCH",
            body: JSON.stringify({
              kycStatus: "rejected",
              rejectionReason: result.error || "BVN verification failed",
            }),
          });
          await refresh();
          await fetchUserData();
        } catch (statusError) {
          console.error("Failed to update KYC status:", statusError);
        }

        toast({
          variant: "destructive",
          title: "Verification Failed",
          description:
            result.error ||
            "Unable to verify your BVN. Please check your details.",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
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

  const StatusIcon = () => {
    if (status === "approved")
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === "rejected")
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <Clock className="h-5 w-5 text-yellow-600" />;
  };

  const statusMessage =
    {
      approved: "Your KYC has been approved and your wallet is ready to use.",
      rejected: userData?.rejectionReason
        ? `Your KYC was rejected: ${userData.rejectionReason}`
        : "Your KYC was rejected. Please review your information and try again.",
      pending:
        "Please complete your KYC verification to access wallet features.",
    }[status] ?? "";

  // ── Approved state ─────────────────────────────────────────────────────────
  if (status === "approved") {
    return (
      <div className="space-y-6 max-w-2xl mx-auto font-headline">
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>KYC Verification</CardTitle>
              <Badge className="flex items-center gap-2 bg-green-100 text-green-800">
                <StatusIcon /> Approved
              </Badge>
            </div>
            <CardDescription>{statusMessage}</CardDescription>
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

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl mx-auto font-headline">
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Complete KYC Verification</CardTitle>
            <Badge
              variant={status === "rejected" ? "destructive" : "secondary"}
              className="flex items-center gap-2"
            >
              <StatusIcon />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
          <CardDescription>{statusMessage}</CardDescription>
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name + Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName">First Name</Label>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="firstName"
                      disabled={submitting}
                      placeholder="John"
                    />
                  )}
                />
                {errors.firstName && (
                  <p className="text-red-600 text-sm">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="lastName">Last Name</Label>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="lastName"
                      disabled={submitting}
                      placeholder="Doe"
                    />
                  )}
                />
                {errors.lastName && (
                  <p className="text-red-600 text-sm">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Middle Name */}
            <div className="space-y-1">
              <Label htmlFor="middleName">Middle Name (Optional)</Label>
              <Controller
                control={control}
                name="middleName"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="middleName"
                    disabled={submitting}
                    placeholder="Optional"
                  />
                )}
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="phone"
                    type="tel"
                    disabled={submitting}
                    placeholder="+2348012345678 or 08012345678"
                  />
                )}
              />
              {errors.phone && (
                <p className="text-red-600 text-sm">{errors.phone.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-1">
              <Label htmlFor="dob">Date of Birth</Label>
              <Controller
                control={control}
                name="dob"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="dob"
                    type="date"
                    disabled={submitting}
                  />
                )}
              />
              {errors.dob && (
                <p className="text-red-600 text-sm">{errors.dob.message}</p>
              )}
            </div>

            {/* BVN */}
            <div className="space-y-1">
              <Label htmlFor="bvn">BVN (11 digits)</Label>
              <Controller
                control={control}
                name="bvn"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="bvn"
                    inputMode="numeric"
                    maxLength={11}
                    disabled={submitting}
                    placeholder="Enter your 11-digit BVN"
                  />
                )}
              />
              {errors.bvn && (
                <p className="text-red-600 text-sm">{errors.bvn.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Your BVN is used for identity verification and is kept secure.
              </p>
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <Label htmlFor="gender">Gender</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={submitting}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && (
                <p className="text-red-600 text-sm">{errors.gender.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
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

      {/* Info card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">
            Why do we need this information?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Identity Verification:</strong> We verify your identity to
            comply with financial regulations.
          </p>
          <p>
            <strong>Security:</strong> KYC helps protect your account and
            prevent fraud.
          </p>
          <p>
            <strong>Wallet Creation:</strong> A verified identity is required to
            create your secure wallet.
          </p>
          <p>
            <strong>Compliance:</strong> We follow banking regulations to ensure
            safe transactions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
