"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FileText,
  Handshake,
  AlertTriangle,
  MessageSquare,
  DollarSign,
  TrendingUp,
  UserCheck,
  Plus,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lock,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [deals, setDeals] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [contactSubmissions, setContactSubmissions] = useState([]);
  const [specialClients, setSpecialClients] = useState([]);
  const [fraudReviews, setFraudReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Whitelist/Review State
  const [newSpecialEmail, setNewSpecialEmail] = useState("");
  const [reviewDealId, setReviewDealId] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Authentication State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminAuthEmail, setAdminAuthEmail] = useState("");
  const [adminAuthPass, setAdminAuthPass] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [expandedDispute, setExpandedDispute] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (
      user &&
      !["raniem57@gmail.com", "mountescrow@gmail.com"].includes(user.email)
    ) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Admin access required",
      });
      router.push("/dashboard");
      return;
    }
    if (user && isAuthorized) {
      fetchDashboardData();
    }
  }, [user, authLoading, isAuthorized]);

  const handleVerifyAccess = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const res = await fetch("/api/admin/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminAuthEmail,
          password: adminAuthPass,
        }),
      });
      if (res.ok) {
        setIsAuthorized(true);
        toast({ title: "Access Granted", description: "Dashboard unlocked." });
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Invalid credentials.",
        });
      }
    } catch (err) {
      toast({ variant: "destructive", description: "Verification failed." });
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const responses = await Promise.all([
        fetch("/api/admin/dashboard-stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/proposals"),
        fetch("/api/admin/deals"),
        fetch("/api/admin/disputes"),
        fetch("/api/admin/contact-submissions"),
        fetch("/api/admin/special-clients").catch(() => ({
          ok: true,
          json: () => Promise.resolve({ clients: [] }),
        })),
        fetch("/api/admin/fraud-reviews").catch(() => ({
          ok: true,
          json: () => Promise.resolve({ reviews: [] }),
        })),
      ]);

      const [
        statsRes,
        usersRes,
        proposalsRes,
        dealsRes,
        disputesRes,
        contactRes,
        specialRes,
        reviewRes,
      ] = responses;

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const proposalsData = await proposalsRes.json();
      const dealsData = await dealsRes.json();
      const disputesData = await disputesRes.json();
      const contactData = await contactRes.json();
      const specialData =
        specialRes && specialRes.ok ? await specialRes.json() : { clients: [] };
      const reviewData =
        reviewRes && reviewRes.ok ? await reviewRes.json() : { reviews: [] };

      setStats(statsData.stats);
      setUsers(usersData.users || []);
      setProposals(proposalsData.proposals || []);
      setDeals(dealsData.deals || []);
      setDisputes(disputesData.disputes || []);
      setContactSubmissions(contactData.submissions || []);
      setSpecialClients(specialData.clients || []);
      setFraudReviews(reviewData.reviews || []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFraudReview = async () => {
    if (!reviewDealId) return;
    setIsActionLoading(true);
    // Find project title if deal exists in memory
    const existingDeal = deals.find((d) => d.id === reviewDealId);
    try {
      const res = await fetch("/api/admin/fraud-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: reviewDealId,
          reason: reviewReason,
          projectTitle: existingDeal?.projectTitle,
        }),
      });
      if (res.ok) {
        toast({ title: "Flagged", description: "Deal added to fraud review." });
        setReviewDealId("");
        setReviewReason("");
        fetchDashboardData();
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveFraudReview = async (dealId) => {
    if (!confirm("Remove this deal from review?")) return;
    try {
      const res = await fetch(`/api/admin/fraud-reviews/${dealId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Removed", description: "Deal removed from review." });
        fetchDashboardData();
      }
    } catch (err) {
      toast({ variant: "destructive", description: "Failed to remove deal." });
    }
  };

  const handleAddSpecialClient = async () => {
    if (!newSpecialEmail.includes("@")) return;
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/special-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newSpecialEmail.toLowerCase().trim() }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "User whitelisted." });
        setNewSpecialEmail("");
        fetchDashboardData();
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveSpecialClient = async (email) => {
    if (!confirm(`Remove ${email} from whitelist?`)) return;
    try {
      const res = await fetch(`/api/admin/special-clients/${email}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Removed", description: "User removed." });
        fetchDashboardData();
      }
    } catch (err) {
      toast({ variant: "destructive", description: "Failed to remove user" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "N/A";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved" || s === "success" || s === "resolved")
      return <Badge className="bg-green-500">{status}</Badge>;
    if (s === "pending" || s === "unread")
      return <Badge variant="secondary">{status}</Badge>;
    if (s === "rejected" || s === "dispute")
      return <Badge variant="destructive">{status}</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (!isAuthorized) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-[425px] font-headline">
          <DialogHeader>
            <div className="mx-auto bg-primary-blue/10 p-3 rounded-full w-fit mb-4">
              <Lock className="h-6 w-6 text-primary-blue" />
            </div>
            <DialogTitle className="text-center text-2xl">
              Admin Verification
            </DialogTitle>
            <DialogDescription className="text-center">
              Enter master admin credentials to proceed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyAccess} className="space-y-4 py-4">
            <Input
              type="email"
              placeholder="Master Email"
              value={adminAuthEmail}
              onChange={(e) => setAdminAuthEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Master Password"
              value={adminAuthPass}
              onChange={(e) => setAdminAuthPass(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full bg-primary-blue"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                "Unlock Dashboard"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (loading)
    return (
      <div className="p-10">
        <Skeleton className="h-screen w-full" />
      </div>
    );

  return (
    <div className="min-h-screen font-headline bg-[#f8fafc] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Fraud control and platform activity monitor
            </p>
          </div>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            className="gap-2 bg-white"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Data
          </Button>
        </div>

        <div className="grid bg-primary-blue p-4 gap-2 rounded-lg grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          {[
            { t: "Users", v: stats?.totalUsers, i: Users },
            { t: "Proposals", v: stats?.totalProposals, i: FileText },
            { t: "Active Deals", v: stats?.totalDeals, i: Handshake },
            {
              t: "Revenue",
              v: formatCurrency(stats?.totalRevenue),
              i: DollarSign,
            },
            { t: "Open Disputes", v: stats?.totalDisputes, i: AlertTriangle },
            { t: "Messages", v: stats?.totalMessages, i: MessageSquare },
          ].map((stat, idx) => (
            <Card key={idx} className="bg-white border-none my-2 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.t}
                </CardTitle>
                <stat.i className="h-4 w-4 text-primary-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{stat.v || 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="md:hidden w-full mb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full bg-primary-blue text-white h-12 border-none">
                <SelectValue placeholder="Navigate sections..." />
              </SelectTrigger>
              <SelectContent className="font-headline bg-white">
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="special_clients">Special Clients</SelectItem>
                <SelectItem value="fraud_review">Fraud Review</SelectItem>{" "}
                {/* Added this */}
                <SelectItem value="proposals">Proposals</SelectItem>
                <SelectItem value="deals">Deals</SelectItem>
                <SelectItem value="disputes">Disputes</SelectItem>
                <SelectItem value="messages">Messages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsList className="hidden md:grid w-full grid-cols-8 bg-primary-blue h-12 p-1 text-white shadow-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="special_clients">Whitelist</TabsTrigger>
            <TabsTrigger value="fraud_review">Review</TabsTrigger>{" "}
            {/* Added this */}
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent
            value="overview"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-sm">Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {users.slice(0, 5).map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-sm font-medium">
                          {u.name}
                        </TableCell>
                        <TableCell className="text-xs">{u.email}</TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(u.kycStatus)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-sm">Latest Proposals</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {proposals.slice(0, 5).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-medium truncate max-w-[150px]">
                          {p.projectTitle}
                        </TableCell>
                        <TableCell className="text-xs text-right font-bold">
                          {formatCurrency(p.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SPECIAL CLIENTS */}
          <TabsContent value="special_clients">
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Whitelisted Users</CardTitle>
                  <CardDescription>
                    Projects &gt; ₦100M Authorized
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary-blue gap-2">
                      <Plus className="h-4 w-4" /> Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Whitelist User</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="Email"
                        value={newSpecialEmail}
                        onChange={(e) => setNewSpecialEmail(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAddSpecialClient}
                        disabled={isActionLoading}
                      >
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Added On</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialClients.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.email}</TableCell>
                        <TableCell>{formatDate(c.addedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSpecialClient(c.email)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FRAUD REVIEW */}
          <TabsContent value="fraud_review">
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Flagged Deals</CardTitle>
                  <CardDescription>
                    Deals manually flagged for fraud investigation
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 gap-2 hover:bg-red-700 text-white">
                      <ShieldAlert className="h-4 w-4" /> Flag Deal ID
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="font-headline">
                    <DialogHeader>
                      <DialogTitle>Flag Deal for Review</DialogTitle>
                      <DialogDescription>
                        Flagging a deal ID will track it in the investigation
                        list.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <Input
                        placeholder="Deal ID (e.g. ABC123XYZ)"
                        value={reviewDealId}
                        onChange={(e) => setReviewDealId(e.target.value)}
                      />
                      <Textarea
                        placeholder="Reason for flagging"
                        value={reviewReason}
                        onChange={(e) => setReviewReason(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAddFraudReview}
                        className="bg-red-600"
                        disabled={isActionLoading}
                      >
                        Flag Deal
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal ID</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fraudReviews.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono font-bold text-xs">
                          {r.dealId}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {r.projectTitle}
                        </TableCell>
                        <TableCell className="text-xs text-red-600 italic">
                          "{r.reason}"
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFraudReview(r.dealId)}
                          >
                            <Trash2 className="h-4 w-4 text-slate-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-xs">{u.email}</TableCell>
                        <TableCell>{getStatusBadge(u.kycStatus)}</TableCell>
                        <TableCell className="font-bold text-emerald-600">
                          {formatCurrency(u.walletBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROPOSALS */}
          <TabsContent value="proposals">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Title</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium truncate max-w-[200px]">
                          {p.projectTitle}
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.creatorEmail}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(p.totalAmount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(p.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DEALS */}
          <TabsContent value="deals">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Parties</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium truncate max-w-[200px]">
                          {d.projectTitle}
                        </TableCell>
                        <TableCell className="text-[10px] text-slate-500">
                          B: {d.buyerEmail}
                          <br />
                          S: {d.sellerEmail}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(d.totalAmount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(d.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DISPUTES (EXPANDABLE) */}
          <TabsContent value="disputes">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Platform Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Title</TableHead>
                      <TableHead>Raised By</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((d) => (
                      <React.Fragment key={d.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() =>
                            setExpandedDispute(
                              expandedDispute === d.id ? null : d.id
                            )
                          }
                        >
                          <TableCell className="font-medium">
                            {d.projectTitle}
                          </TableCell>
                          <TableCell className="text-xs">
                            {d.raisedByEmail}
                          </TableCell>
                          <TableCell className="text-right">
                            {expandedDispute === d.id ? (
                              <ChevronUp className="h-4 w-4 ml-auto" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedDispute === d.id && (
                          <TableRow className="bg-slate-50/50">
                            <TableCell colSpan={3} className="p-6">
                              <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Context
                                  </p>
                                  <div className="bg-white p-3 rounded border text-sm space-y-1">
                                    <p>
                                      <strong>Deal ID:</strong> {d.dealId}
                                    </p>
                                    <p>
                                      <strong>Buyer:</strong> {d.buyerEmail}
                                    </p>
                                    <p>
                                      <strong>Seller:</strong> {d.sellerEmail}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Reason
                                  </p>
                                  <div className="bg-red-50 p-4 rounded border border-red-100 italic text-sm text-red-900">
                                    "{d.reason}"
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MESSAGES */}
          <TabsContent value="messages">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactSubmissions.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <p className="font-bold text-sm">{m.name}</p>
                          <p className="text-xs">{m.email}</p>
                        </TableCell>
                        <TableCell className="max-w-md italic text-sm text-slate-700">
                          "{m.message}"
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(m.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
