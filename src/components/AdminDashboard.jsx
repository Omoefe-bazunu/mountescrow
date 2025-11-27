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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    // Check if user is admin
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

    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router, toast]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        usersRes,
        proposalsRes,
        dealsRes,
        disputesRes,
        contactRes,
      ] = await Promise.all([
        fetch("/api/admin/dashboard-stats", { credentials: "include" }),
        fetch("/api/admin/users", { credentials: "include" }),
        fetch("/api/admin/proposals", { credentials: "include" }),
        fetch("/api/admin/deals", { credentials: "include" }),
        fetch("/api/admin/disputes", { credentials: "include" }),
        fetch("/api/admin/contact-submissions", { credentials: "include" }),
      ]);

      if (!statsRes.ok || !usersRes.ok) throw new Error("Failed to fetch data");

      const [
        statsData,
        usersData,
        proposalsData,
        dealsData,
        disputesData,
        contactData,
      ] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        proposalsRes.json(),
        dealsRes.json(),
        disputesRes.json(),
        contactRes.json(),
      ]);

      setStats(statsData.stats);
      setUsers(usersData.users || []);
      setProposals(proposalsData.proposals || []);
      setDeals(dealsData.deals || []);
      setDisputes(disputesData.disputes || []);
      setContactSubmissions(contactData.submissions || []);
    } catch (err) {
      console.error("Dashboard data error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: `${stats?.recentUsers || 0} new this week`,
      color: "blue",
    },
    {
      title: "Total Proposals",
      value: stats?.totalProposals || 0,
      icon: FileText,
      description: `${stats?.recentProposals || 0} new this week`,
      color: "green",
    },
    {
      title: "Active Deals",
      value: stats?.totalDeals || 0,
      icon: Handshake,
      description: "All time deals",
      color: "purple",
    },
    {
      title: "Platform Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      description: "Total escrow fees",
      color: "orange",
    },
    {
      title: "Open Disputes",
      value: stats?.totalDisputes || 0,
      icon: AlertTriangle,
      description: "Requiring attention",
      color: "red",
    },
    {
      title: "Messages",
      value: stats?.totalMessages || 0,
      icon: MessageSquare,
      description: "Contact form submissions",
      color: "indigo",
    },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      active: { variant: "default", label: "Active" },
      completed: { variant: "default", label: "Completed" },
      resolved: { variant: "default", label: "Resolved" },
      unread: { variant: "secondary", label: "Unread" },
      read: { variant: "default", label: "Read" },
    };

    const config = statusConfig[status] || {
      variant: "outline",
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen font-headline bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your platform and monitor activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid bg-primary-blue p-4 gap-2 rounded-lg grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          {statCards.map((stat, index) => (
            <Card
              key={stat.title}
              className="relative overflow-hidden bg-white my-2"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 text-${stat.color}-500`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6 lg:max-w-2xl bg-primary-blue">
            <TabsTrigger value="overview" className="text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white">
              Users
            </TabsTrigger>
            <TabsTrigger value="proposals" className="text-white">
              Proposals
            </TabsTrigger>
            <TabsTrigger value="deals" className="text-white">
              Deals
            </TabsTrigger>
            <TabsTrigger value="disputes" className="text-white">
              Disputes
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-white">
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Recent Users
                  </CardTitle>
                  <CardDescription>Newly registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.slice(0, 5).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {getStatusBadge(user.kycStatus)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Recent Proposals */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Proposals
                  </CardTitle>
                  <CardDescription>Latest proposal submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposals.slice(0, 5).map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {proposal.projectTitle}
                          </TableCell>
                          <TableCell>{proposal.creatorEmail}</TableCell>
                          <TableCell>
                            {formatCurrency(proposal.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Recent Disputes */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Disputes
                </CardTitle>
                <CardDescription>Disputes requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Raised By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.slice(0, 5).map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {dispute.projectTitle}
                        </TableCell>
                        <TableCell>{dispute.raisedByEmail}</TableCell>
                        <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                        <TableCell>{formatDate(dispute.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Manage platform users and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Proposals</TableHead>
                      <TableHead>Deals</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{getStatusBadge(user.kycStatus)}</TableCell>
                        <TableCell>
                          {formatCurrency(user.walletBalance)}
                        </TableCell>
                        <TableCell>{user.proposalsCount}</TableCell>
                        <TableCell>{user.dealsCount}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Proposals Tab */}
          <TabsContent value="proposals">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>All Proposals</CardTitle>
                <CardDescription>Monitor all proposal activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {proposal.projectTitle}
                        </TableCell>
                        <TableCell>{proposal.creatorEmail}</TableCell>
                        <TableCell>{proposal.buyerEmail}</TableCell>
                        <TableCell>{proposal.sellerEmail}</TableCell>
                        <TableCell>
                          {formatCurrency(proposal.totalAmount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                        <TableCell>{formatDate(proposal.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>All Deals</CardTitle>
                <CardDescription>Active and completed deals</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Escrow Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {deal.projectTitle}
                        </TableCell>
                        <TableCell>{deal.buyerEmail}</TableCell>
                        <TableCell>{deal.sellerEmail}</TableCell>
                        <TableCell>
                          {formatCurrency(deal.totalAmount)}
                        </TableCell>
                        <TableCell>{formatCurrency(deal.escrowFee)}</TableCell>
                        <TableCell>{getStatusBadge(deal.status)}</TableCell>
                        <TableCell>{formatDate(deal.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>All Disputes</CardTitle>
                <CardDescription>Monitor and manage disputes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Deal ID</TableHead>
                      <TableHead>Raised By</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {dispute.projectTitle}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {dispute.dealId?.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{dispute.raisedByEmail}</TableCell>
                        <TableCell>{dispute.buyerEmail}</TableCell>
                        <TableCell>{dispute.sellerEmail}</TableCell>
                        <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                        <TableCell>{formatDate(dispute.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Contact Messages</CardTitle>
                <CardDescription>
                  User inquiries and support requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.name}
                        </TableCell>
                        <TableCell>{submission.email}</TableCell>
                        <TableCell>{submission.phone}</TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {submission.message}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(submission.status)}
                        </TableCell>
                        <TableCell>
                          {formatDate(submission.createdAt)}
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
