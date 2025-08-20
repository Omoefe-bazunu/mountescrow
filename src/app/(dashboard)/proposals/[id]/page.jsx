"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getProposalById,
  updateProposalStatus,
  acceptAndFundSellerInitiatedProposal,
} from "@/services/proposal.service.js";
import { createDealFromProposal } from "@/services/deal.service.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Clock,
  DollarSign,
  FileText,
  User,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Download,
  File,
  Image,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id;

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user && id) {
        const fetchProposal = async () => {
          setLoading(true);
          setError(null);
          try {
            const fetchedProposal = await getProposalById(id);
            if (fetchedProposal) {
              setProposal(fetchedProposal);
            } else {
              setError(
                "Proposal not found or you don't have permission to view it."
              );
            }
          } catch (err) {
            console.error("Error fetching proposal:", err);
            setError("An error occurred while fetching the proposal.");
          } finally {
            setLoading(false);
          }
        };
        fetchProposal();
      } else if (!user) {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [id, router]);

  const handleAccept = async () => {
    if (!proposal) return;
    setIsProcessing(true);
    try {
      await updateProposalStatus(proposal.id, "Accepted");
      const dealId = await createDealFromProposal(proposal); // Create deal
      const payload = {
        recipientEmail:
          proposal.creatorRole === "buyer"
            ? proposal.sellerEmail
            : proposal.buyerEmail,
        projectTitle: proposal.projectTitle,
        totalAmount: Number(proposal.totalAmount) || 0,
        status: "Awaiting Funding",
        dealId,
      };
      const res = await fetch("/api/email/deal-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Failed to send deal creation email: ${errorData}`);
      }
      toast({
        title: "Proposal Accepted!",
        description: "A new deal has been created. The buyer will be notified.",
      });
      router.push(`/deals/${dealId}`);
    } catch (error) {
      console.error("Error accepting proposal:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not accept the proposal.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptAndFund = async () => {
    if (!proposal || !currentUser) return;
    setIsProcessing(true);
    try {
      const { dealId } = await acceptAndFundSellerInitiatedProposal(
        proposal.id,
        currentUser.uid
      );
      toast({
        title: "Proposal Accepted & Funded!",
        description:
          "The deal has been created and funded. Work can now begin.",
      });
      router.push(`/deals/${dealId}`);
    } catch (error) {
      console.error("Error accepting and funding proposal:", error);
      const errorMessage =
        error.message ||
        "Could not accept and fund the proposal. Please check your KYC status and balance.";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!proposal) return;
    setIsProcessing(true);
    try {
      await updateProposalStatus(proposal.id, "Declined");
      toast({
        title: "Proposal Declined",
        description: "The buyer will be notified of the rejection.",
      });
      router.push("/proposals");
    } catch (error) {
      console.error("Error declining proposal:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not decline the proposal. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileDownload = async (fileUrl, fileName) => {
    setDownloadingFiles((prev) => new Set(prev).add(fileUrl));
    try {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName || "download";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Download Started",
        description: `Downloading ${fileName}...`,
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description:
          "Could not download the file. Please try the view button to open it in a new tab.",
      });
    } finally {
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileUrl);
        return newSet;
      });
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return <Image className="h-4 w-4" />;
    }
    if (extension === "pdf") {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const getFileNameFromUrl = (url) => {
    try {
      const urlParts = url.split("/");
      const fileNameWithParams = urlParts[urlParts.length - 1];
      const fileName = fileNameWithParams.split("?")[0];
      const cleanFileName = fileName.replace(/^\d+_\d+_/, "");
      return decodeURIComponent(cleanFileName);
    } catch (error) {
      return "Unknown File";
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "AwaitingBuyerAcceptance":
        return "secondary";
      case "Accepted":
        return "default";
      case "Declined":
        return "destructive";
      case "Completed":
        return "default";
      default:
        return "outline";
    }
  };

  const toDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return null;
    return new Date(timestamp.seconds * 1000);
  };

  const isSeller = currentUser?.email === proposal?.sellerEmail;
  const isBuyer =
    currentUser?.uid === proposal?.buyerId ||
    currentUser?.email === proposal?.buyerEmail;
  const showSellerActionButtons = isSeller && proposal?.status === "Pending";
  const showBuyerAcceptAndFundButton =
    isBuyer && proposal?.status === "AwaitingBuyerAcceptance";

  const buyerEscrowFeePortion = proposal
    ? proposal.escrowFee * (proposal.escrowFeePayer / 100)
    : 0;
  const sellerEscrowFeePortion = proposal
    ? proposal.escrowFee * ((100 - proposal.escrowFeePayer) / 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
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
      <Card className="my-0">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="font-headline text-3xl">
                {proposal.projectTitle}
              </CardTitle>
              <CardDescription className="mt-2">
                Created on{" "}
                {toDate(proposal.createdAt)
                  ? format(toDate(proposal.createdAt), "PPP")
                  : "N/A"}
              </CardDescription>
            </div>
            <Badge
              variant={getStatusVariant(proposal.status)}
              className="text-base px-4 py-2"
            >
              {proposal.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none text-muted-foreground">
            <p>{proposal.description}</p>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <strong>Buyer:</strong>
              <span>{proposal.buyerEmail || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              <strong>Seller:</strong>
              <span>{proposal.sellerEmail}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {proposal.files && proposal.files.length > 0 && (
        <Card className="my-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Files ({proposal.files.length})
            </CardTitle>
            <CardDescription>
              Supporting documents and files attached to this proposal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {proposal.files.map((fileUrl, index) => {
                const fileName = getFileNameFromUrl(fileUrl);
                const isDownloading = downloadingFiles.has(fileUrl);

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(fileName)}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          title={fileName}
                        >
                          {fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click to download
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(fileUrl, "_blank")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileDownload(fileUrl, fileName)}
                        disabled={isDownloading}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-4 font-headline">Milestones</h3>
        <div className="space-y-4">
          {proposal.milestones.map((milestone, index) => (
            <Card key={index} className="my-0">
              <CardHeader>
                <CardTitle className="text-xl">{milestone.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-1 shrink-0" />{" "}
                  <span>{milestone.description}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <strong>Amount:</strong>
                    <span>₦{milestone.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <strong>Due Date:</strong>
                    <span>
                      {toDate(milestone.dueDate)
                        ? format(toDate(milestone.dueDate), "PPP")
                        : format(new Date(milestone.dueDate), "PPP")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="my-0">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="font-medium">
              ₦{proposal.totalAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Escrow Fee (
              {((proposal.escrowFee / proposal.totalAmount) * 100).toFixed(0)}%)
            </span>
            <span className="font-medium">
              ₦{proposal.escrowFee.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground ml-4">
              • Buyer pays ({proposal.escrowFeePayer}%)
            </span>
            <span className="font-medium">
              ₦{buyerEscrowFeePortion.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground ml-4">
              • Seller pays ({100 - proposal.escrowFeePayer}%)
            </span>
            <span className="font-medium">
              ₦{sellerEscrowFeePortion.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total Project Value</span>
            <span>₦{proposal.totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
        {(showSellerActionButtons || showBuyerAcceptAndFundButton) && (
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={isProcessing}
            >
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Decline
            </Button>
            {showSellerActionButtons && (
              <Button onClick={handleAccept} disabled={isProcessing}>
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Accept & Create Deal
              </Button>
            )}
            {showBuyerAcceptAndFundButton && (
              <Button onClick={handleAcceptAndFund} disabled={isProcessing}>
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Accept & Fund Deal
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
