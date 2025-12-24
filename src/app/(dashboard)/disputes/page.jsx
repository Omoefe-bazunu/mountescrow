"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function DisputesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const fetchDisputes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log("🔄 Fetching disputes for:", user.email);

      const res = await fetch("/api/disputes/my", {
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ API Error:", res.status, errorText);
        throw new Error(`Failed to fetch disputes: ${res.status}`);
      }

      const data = await res.json();
      console.log("📦 Disputes data received:", data);

      setDisputes(data.disputes || []);
    } catch (err) {
      console.error("❌ Fetch disputes error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load disputes",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDisputes();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleMarkResolved = async (disputeId) => {
    setResolvingId(disputeId);
    try {
      console.log(`🔄 Resolving dispute: ${disputeId}`);

      const res = await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to resolve: ${res.status}`);
      }

      const result = await res.json();

      toast({
        title: "Dispute Resolved",
        description: "Marked as resolved.",
      });

      // Update local state
      setDisputes((prev) =>
        prev.map((d) => (d.id === disputeId ? { ...d, status: "resolved" } : d))
      );
    } catch (err) {
      console.error("❌ Resolve error:", err);
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not mark as resolved",
      });
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    let date;
    if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

    return date && !isNaN(date) ? format(date, "PPP") : "N/A";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "in_review":
        return <Badge variant="default">In Review</Badge>;
      case "resolved":
        return (
          <Badge variant="default" className="bg-green-600 text-white">
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-headline max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Disputes</h1>
          <p className="text-muted-foreground mt-1">
            View and manage disputes you've raised
          </p>
        </div>
      </div>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No disputes found</p>
            <p className="text-sm mt-2">
              When you raise a dispute, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {disputes.map((dispute) => {
            const milestone =
              dispute.milestoneIndex !== undefined &&
              dispute.milestoneIndex !== null
                ? `Milestone ${Number(dispute.milestoneIndex) + 1}`
                : "General";

            return (
              <Card key={dispute.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold">
                        {dispute.projectTitle}
                      </CardTitle>
                      <CardDescription>
                        Raised on {formatDate(dispute.createdAt)}
                      </CardDescription>
                    </div>
                    {getStatusBadge(dispute.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-bold">Disputed Milestone:</span>{" "}
                      {milestone}
                    </div>
                    <div>
                      <span className="font-bold">Deal ID:</span>{" "}
                      {dispute.dealId}
                    </div>
                  </div>

                  <div>
                    <p className="font-bold mb-1">Reason:</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {dispute.reason}
                    </p>
                  </div>

                  {dispute.files?.length > 0 && (
                    <div>
                      <p className="font-bold mb-2">Attached Proof:</p>
                      <div className="flex flex-wrap gap-2">
                        {dispute.files.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            File {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {dispute.status !== "resolved" && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => handleMarkResolved(dispute.id)}
                        disabled={resolvingId === dispute.id}
                        className="w-full sm:w-auto"
                      >
                        {resolvingId === dispute.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Mark as Resolved
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
