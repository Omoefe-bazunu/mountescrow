"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Shield,
  Loader2,
  Edit2,
  X,
  Check,
  Key,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { submitDeletionRequest } from "@/services/dataDeletion.service"; // ✅ Import service

export default function UserProfile() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [submittingDeletion, setSubmittingDeletion] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!user) {
      if (!authLoading) router.push("/login");
      return;
    }

    fetchUserData();
  }, [user, authLoading, router]);

  const handleDeleteDataPress = () => {
    setShowDeletionModal(true);
  };

  const handleSubmitDeletionRequest = async () => {
    if (!deletionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Required",
        description: "Please provide a reason for deletion.",
      });
      return;
    }

    setSubmittingDeletion(true);
    try {
      // ✅ Use service instead of direct fetch
      const data = await submitDeletionRequest(deletionReason);

      toast({
        title: "Request Submitted",
        description:
          data.message ||
          "Your data deletion request has been submitted. Our team will review it shortly.",
      });

      setShowDeletionModal(false);
      setDeletionReason("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit deletion request.",
      });
    } finally {
      setSubmittingDeletion(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/check", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        setFormData({
          displayName: data.user.displayName || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/users/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Update failed");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setIsEditing(false);
      await refresh();
      await fetchUserData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    try {
      // Handle ISO string (from backend)
      if (typeof timestamp === "string") {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return format(date, "PPP");
        }
      }

      // Handle Firestore Timestamp objects with toDate() method
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        return format(timestamp.toDate(), "PPP");
      }

      // Handle objects with 'seconds' property (Firestore Timestamp serialized)
      if (timestamp.seconds !== undefined) {
        const date = new Date(timestamp.seconds * 1000);
        return format(date, "PPP");
      }

      // Handle objects with '_seconds' property
      if (timestamp._seconds !== undefined) {
        const date = new Date(timestamp._seconds * 1000);
        return format(date, "PPP");
      }

      // Handle regular Date objects
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return format(date, "PPP");
      }

      return "N/A";
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || !userData) return null;

  return (
    <div className="space-y-4 font-headline">
      {/* Header */}
      <Card className="my-0 bg-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-2xl">
                Profile Settings
              </CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    displayName: userData.displayName || "",
                    email: userData.email || "",
                    phone: userData.phone || "",
                  });
                }}
                variant="outline"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="font-headline text-xl">
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{userData.displayName}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{userData.email}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-4">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{userData.phone}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="font-headline text-xl">
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">KYC Status</p>
                <div className="font-medium">
                  <Badge
                    variant={
                      userData.kycStatus === "approved"
                        ? "default"
                        : userData.kycStatus === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {userData.kycStatus === "approved"
                      ? "Verified"
                      : userData.kycStatus === "rejected"
                        ? "Rejected"
                        : "Pending"}
                  </Badge>
                </div>
              </div>
            </div>
            {userData.kycStatus !== "approved" && (
              <Button
                onClick={() => router.push("/kyc")}
                size="sm"
                variant="outline"
              >
                Complete KYC
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex items-center space-x-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                Email Verification
              </p>
              <div className="font-medium">
                <Badge variant={userData.isVerified ? "default" : "secondary"}>
                  {userData.isVerified ? "Verified" : "Not Verified"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">{formatDate(userData.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Information */}
      {userData.accountNumber && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              Banking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Virtual Account Number
                </p>
                <p className="font-medium font-mono">
                  {userData.accountNumber}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center space-x-4">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Bank Name</p>
                <p className="font-medium">{userData.bankName} MFB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BVN Information (if available) */}
      {userData.kycData && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              KYC Information
            </CardTitle>
            <CardDescription>
              This information is securely stored and verified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">First Name</p>
                <p className="font-medium">{userData.kycData.firstName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Last Name</p>
                <p className="font-medium">{userData.kycData.lastName}</p>
              </div>

              {userData.kycData.middleName && (
                <div>
                  <p className="text-sm text-muted-foreground">Middle Name</p>
                  <p className="font-medium">{userData.kycData.middleName}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{userData.kycData.gender}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">BVN</p>
                <p className="font-medium font-mono">
                  {userData.kycData.bvn.slice(0, 3)}********
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Verified On</p>
                <p className="font-medium">
                  {formatDate(userData.kycData.verifiedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Reset */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Security</CardTitle>
          <CardDescription>
            Update your password regularly to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowChangePassword(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Key className="h-4 w-4" />
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Data Privacy Section */}
      <Card className="bg-white border-red-200">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-red-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Data Privacy
          </CardTitle>
          <CardDescription className="text-red-700/70">
            Request the permanent removal of your personal data from our
            systems. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleDeleteDataPress}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Request Data Deletion
          </Button>
        </CardContent>
      </Card>

      {/* Data Deletion Request Dialog */}
      <Dialog open={showDeletionModal} onOpenChange={setShowDeletionModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Request Data Deletion
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for requesting deletion of your data. This
              action cannot be undone once approved by our team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for Deletion <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Please explain why you want to delete your data..."
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Once your deletion request is
                approved and processed, all your personal data, transaction
                history, and account information will be permanently removed
                from our systems.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeletionModal(false);
                setDeletionReason("");
              }}
              disabled={submittingDeletion}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleSubmitDeletionRequest}
              disabled={submittingDeletion || !deletionReason.trim()}
            >
              {submittingDeletion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChangePasswordModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </div>
  );
}
