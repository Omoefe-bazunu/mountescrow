"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ResetPasswordPage() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const sendCode = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const emailValue = formData.get("email").trim();

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        body: JSON.stringify({ email: emailValue }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEmail(emailValue);
      setStep("code");
      toast({ title: "Verification code sent!", className: "bg-white" });
    } catch (err) {
      setError(err.message);
      toast({
        variant: "destructive",
        className: "bg-white",
        title: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    const inputCode = e.target.code.value.trim();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password/verify", {
        method: "POST",
        body: JSON.stringify({ email, code: inputCode }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setCode(inputCode);
      setStep("newPassword");
    } catch (err) {
      setError(err.message);
      toast({
        variant: "destructive",
        className: "bg-white",
        title: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const password = formData.get("password");
    const confirm = formData.get("confirm");

    // Clear previous errors
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      toast({
        variant: "destructive",
        className: "bg-white",
        title: "Passwords do not match",
      });
      return;
    }

    // Additional password validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      toast({
        variant: "destructive",
        className: "bg-white",
        title: "Password must be at least 8 characters",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password/complete", {
        method: "POST",
        body: JSON.stringify({ email, code, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update password");
      }

      toast({
        title: "Password changed successfully!",
        description: "You will be redirected to login page.",
        className: "bg-white",
      });
      setTimeout(() => (window.location.href = "/login"), 1500);
    } catch (err) {
      setError(err.message);
      toast({
        variant: "destructive",
        className: "bg-white",
        title: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white w-full h-screen">
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">
              {step === "email" && "Reset Password"}
              {step === "code" && "Enter Verification Code"}
              {step === "newPassword" && "Set New Password"}
            </DialogTitle>
            {step === "newPassword" && (
              <DialogDescription className="text-center">
                Your new password must be different from your previous
                passwords.
              </DialogDescription>
            )}
          </DialogHeader>

          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={sendCode} className="space-y-6">
              <div className="space-y-2">
                <Input
                  name="email"
                  type="email"
                  placeholder="Your email"
                  required
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  Enter your email to receive a verification code.
                </p>
              </div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Verification Code
              </Button>
            </form>
          )}

          {/* Step 2: Code */}
          {step === "code" && (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="space-y-2">
                <Input
                  name="code"
                  placeholder="8-digit code"
                  maxLength={8}
                  className="text-center text-lg tracking-wider font-mono"
                  required
                />
                <p className="text-sm text-gray-500">
                  Enter the 8-digit code sent to your email.
                </p>
              </div>
              <Button className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Code
              </Button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "newPassword" && (
            <form onSubmit={changePassword} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    name="password"
                    type="password"
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters and different from previous
                    passwords.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <Input
                    name="confirm"
                    type="password"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              <Button className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save New Password
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
