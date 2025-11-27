// "use client";

// import { useEffect, useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { AlertTriangle, Users, DollarSign, FileText } from "lucide-react";
// import Link from "next/link";
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   orderBy,
//   limit,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// export default function AdminDashboard() {
//   const [stats, setStats] = useState({
//     totalUsers: 0,
//     activeDeals: 0,
//     openDisputes: 0,
//     totalVolume: 0,
//     recentDisputes: [],
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchAdminStats();
//   }, []);

//   const fetchAdminStats = async () => {
//     try {
//       // Get total users
//       const usersSnapshot = await getDocs(collection(db, "users"));
//       const totalUsers = usersSnapshot.size;

//       // Get active deals
//       const activeDealsQuery = query(
//         collection(db, "deals"),
//         where("status", "in", ["Awaiting Funding", "In Progress"])
//       );
//       const activeDealsSnapshot = await getDocs(activeDealsQuery);
//       const activeDeals = activeDealsSnapshot.size;

//       // Get open disputes
//       const openDisputesQuery = query(
//         collection(db, "disputes"),
//         where("status", "==", "open")
//       );
//       const openDisputesSnapshot = await getDocs(openDisputesQuery);
//       const openDisputes = openDisputesSnapshot.size;

//       // Get recent disputes
//       const recentDisputesQuery = query(
//         collection(db, "disputes"),
//         orderBy("createdAt", "desc"),
//         limit(5)
//       );
//       const recentDisputesSnapshot = await getDocs(recentDisputesQuery);
//       const recentDisputes = recentDisputesSnapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));

//       // Calculate total volume (placeholder for now)
//       const totalVolume = 0;

//       setStats({
//         totalUsers,
//         activeDeals,
//         openDisputes,
//         totalVolume,
//         recentDisputes,
//       });
//     } catch (error) {
//       console.error("Error fetching admin stats:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusVariant = (status) => {
//     switch (status) {
//       case "open":
//         return "destructive";
//       case "investigating":
//         return "secondary";
//       case "resolved":
//         return "default";
//       case "closed":
//         return "outline";
//       default:
//         return "outline";
//     }
//   };

//   const getPriorityVariant = (priority) => {
//     switch (priority) {
//       case "high":
//         return "destructive";
//       case "medium":
//         return "secondary";
//       case "low":
//         return "outline";
//       default:
//         return "outline";
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold">Admin Dashboard</h1>
//         <p className="text-muted-foreground">
//           Monitor platform activity and manage disputes
//         </p>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid gap-x-4 md:grid-cols-2 lg:grid-cols-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Users</CardTitle>
//             <Users className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalUsers}</div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
//             <FileText className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.activeDeals}</div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
//             <AlertTriangle className="h-4 w-4 text-destructive" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-destructive">
//               {stats.openDisputes}
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
//             <DollarSign className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               ${stats.totalVolume.toLocaleString()}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Quick Actions */}
//       <div className="grid gap-4 md:grid-cols-2">
//         <Card>
//           <CardHeader>
//             <CardTitle>Quick Actions</CardTitle>
//             <CardDescription>Common administrative tasks</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-2">
//             <Button asChild className="w-full justify-start">
//               <Link href="/admin/disputes">
//                 <AlertTriangle className="mr-2 h-4 w-4" />
//                 Manage Disputes
//               </Link>
//             </Button>
//             <Button asChild variant="outline" className="w-full justify-start">
//               <Link href="/admin/users">
//                 <Users className="mr-2 h-4 w-4" />
//                 User Management
//               </Link>
//             </Button>
//             <Button asChild variant="outline" className="w-full justify-start">
//               <Link href="/admin/transactions">
//                 <DollarSign className="mr-2 h-4 w-4" />
//                 Transaction Logs
//               </Link>
//             </Button>
//           </CardContent>
//         </Card>

//         {/* Recent Disputes */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Recent Disputes</CardTitle>
//             <CardDescription>
//               Latest dispute filings requiring attention
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {stats.recentDisputes.length > 0 ? (
//               <div className="space-y-3">
//                 {stats.recentDisputes.map((dispute) => (
//                   <div
//                     key={dispute.id}
//                     className="flex items-center justify-between p-3 border rounded-lg"
//                   >
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium">{dispute.subject}</p>
//                       <div className="flex items-center gap-2">
//                         <Badge
//                           variant={getPriorityVariant(dispute.priority)}
//                           className="text-xs"
//                         >
//                           {dispute.priority}
//                         </Badge>
//                         <Badge
//                           variant={getStatusVariant(dispute.status)}
//                           className="text-xs"
//                         >
//                           {dispute.status}
//                         </Badge>
//                       </div>
//                     </div>
//                     <Button asChild size="sm" variant="ghost">
//                       <Link href={`/admin/disputes/${dispute.id}`}>View</Link>
//                     </Button>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-sm text-muted-foreground">
//                 No recent disputes
//               </p>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
