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
} from "@/components/ui/dialog";

export default function ResetPasswordPage() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendCode = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const emailValue = formData.get("email").trim();

    setLoading(true);
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

    if (password !== confirm) {
      toast({
        variant: "destructive",
        className: "bg-white",
        title: "Passwords do not match",
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
        throw new Error(data.error || "Failed");
      }
      toast({ title: "Password changed successfully!", className: "bg-white" });
      setTimeout(() => (window.location.href = "/login"), 1500);
    } catch (err) {
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
          </DialogHeader>

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={sendCode} className="space-y-6">
              <Input
                name="email"
                type="email"
                placeholder="Your email"
                required
              />
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
              <Input
                name="code"
                placeholder="8-digit code"
                maxLength={8}
                className="text-center text-lg tracking-wider font-mono"
                required
              />
              <Button className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Code
              </Button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "newPassword" && (
            <form onSubmit={changePassword} className="space-y-4">
              <Input
                name="password"
                type="password"
                placeholder="New password"
                required
                minLength={8}
              />
              <Input
                name="confirm"
                type="password"
                placeholder="Confirm password"
                required
              />
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
