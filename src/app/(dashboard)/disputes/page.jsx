"use client";

import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, PlusCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getDisputes } from "@/services/dispute.service";
import { CreateDisputeDialog } from "./_components/create-dispute-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function DisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchDisputes();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const userDisputes = await getDisputes();
      setDisputes(userDisputes);
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "open":
        return "destructive";
      case "investigating":
        return "secondary";
      case "resolved":
        return "default";
      case "closed":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "open":
        return "Open";
      case "investigating":
        return "Under Investigation";
      case "resolved":
        return "Resolved";
      case "closed":
        return "Closed";
      default:
        return status;
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const toDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return null;
    return new Date(timestamp.seconds * 1000);
  };

  return (
    <>
      <Card className="my-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Disputes</CardTitle>
            <CardDescription>
              View and manage your transaction disputes.
            </CardDescription>
          </div>
          {user && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              File Dispute
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : disputes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Filed</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">
                      {dispute.reason}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {dispute.projectTitle}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {dispute.dealId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityVariant(dispute.priority)}>
                        {dispute.priority.charAt(0).toUpperCase() +
                          dispute.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(dispute.status)}>
                        {getStatusLabel(dispute.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {toDate(dispute.createdAt)
                        ? format(toDate(dispute.createdAt), "PPP")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/disputes/${dispute.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No disputes filed</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                We hope you never need it, but your disputes will show up here.
              </p>
              {user && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  File Your First Dispute
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {user && (
        <CreateDisputeDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={fetchDisputes}
        />
      )}
    </>
  );
}
