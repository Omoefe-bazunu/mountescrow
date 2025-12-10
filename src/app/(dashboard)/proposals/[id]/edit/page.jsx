// app/proposals/[id]/edit/page.jsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProposalById } from "@/services/proposal.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";
import { EditProposalForm } from "@/components/proposals/EditProposalForm";

export default function EditProposalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const { user, loading: authLoading } = useAuth();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch proposal
  useEffect(() => {
    if (user) {
      const fetchProposal = async () => {
        setLoading(true);
        setError(null);
        try {
          const fetchedProposal = await getProposalById(id);

          if (!fetchedProposal) {
            setError("Proposal not found");
            return;
          }

          // Check if user is the creator
          if (user.email !== fetchedProposal.creatorEmail) {
            setError("Only the proposal creator can edit this proposal");
            return;
          }

          // Check if proposal can be edited
          if (
            !["Pending", "AwaitingBuyerAcceptance"].includes(
              fetchedProposal.status
            )
          ) {
            setError("This proposal cannot be edited anymore");
            return;
          }

          setProposal(fetchedProposal);
        } catch (err) {
          console.error("Error fetching proposal:", err);
          setError("Failed to load proposal");
        } finally {
          setLoading(false);
        }
      };

      fetchProposal();
    }
  }, [id, user]);

  if (loading || authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center my-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle /> Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!proposal) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Edit Proposal</h1>
        <p className="text-muted-foreground mt-2">
          Update your proposal details. The counterparty will see the updated
          information.
        </p>
      </div>

      <EditProposalForm proposal={proposal} proposalId={id} />
    </div>
  );
}
