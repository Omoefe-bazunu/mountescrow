"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function VerifyAccountPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false); // New state for resend button
  const router = useRouter();
  const { refresh } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("📧 Verifying email:", email);

      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), token: code.trim() }),
      });

      const data = await res.json();
      console.log("📡 Verify response:", res.status, data);

      if (res.ok) {
        toast({
          title: "✅ Email Verified!",
          description: "Logging you in...",
          className: "bg-white border-primary-blue font-headline",
        });

        // Wait a moment for cookies to be set
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Refresh auth state
        await refresh();

        console.log("✅ Redirecting to dashboard...");
        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: data.error || "Invalid code or email.",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Connection failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // New function to handle resending code
  const handleResend = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address first.",
      });
      return;
    }

    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Code Sent!",
          description: "Please check your email inbox (and spam folder).",
          className: "bg-green-50 border-green-200",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Resend",
          description: data.error || "Could not send code.",
        });
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to server.",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen font-headline flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the verification code sent to your email
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              required
              placeholder="Enter 8-character code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-mono text-lg tracking-wider"
              maxLength={8}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !code}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {loading ? "Verifying..." : "Verify Account"}
        </button>

        <p className="text-center text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-center gap-1">
          <span>Didn't receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending} // Removed "!email" so the validation toast can trigger
            className="text-orange-500 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {resending ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Sending...
              </>
            ) : (
              "Resend Code"
            )}
          </button>
        </p>
      </form>
    </div>
  );
}
