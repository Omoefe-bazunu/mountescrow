// "use client";

// import { useEffect, useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { ArrowRight, Search, Filter } from "lucide-react";
// import Link from "next/link";
// import { collection, getDocs, query, orderBy } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { format } from "date-fns";
// import { Skeleton } from "@/components/ui/skeleton";

// export default function AdminDisputesPage() {
//   const [disputes, setDisputes] = useState([]);
//   const [filteredDisputes, setFilteredDisputes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [priorityFilter, setPriorityFilter] = useState("all");

//   useEffect(() => {
//     fetchAllDisputes();
//   }, []);

//   useEffect(() => {
//     filterDisputes();
//   }, [disputes, searchTerm, statusFilter, priorityFilter]);

//   const fetchAllDisputes = async () => {
//     try {
//       const disputesQuery = query(
//         collection(db, "disputes"),
//         orderBy("createdAt", "desc")
//       );
//       const snapshot = await getDocs(disputesQuery);
//       const disputesData = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));

//       setDisputes(disputesData);
//     } catch (error) {
//       console.error("Error fetching disputes:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterDisputes = () => {
//     let filtered = disputes;

//     if (searchTerm) {
//       filtered = filtered.filter(
//         (dispute) =>
//           dispute.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           dispute.dealTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           dispute.disputedByEmail
//             ?.toLowerCase()
//             .includes(searchTerm.toLowerCase())
//       );
//     }

//     if (statusFilter !== "all") {
//       filtered = filtered.filter((dispute) => dispute.status === statusFilter);
//     }

//     if (priorityFilter !== "all") {
//       filtered = filtered.filter(
//         (dispute) => dispute.priority === priorityFilter
//       );
//     }

//     setFilteredDisputes(filtered);
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

//   const getStatusLabel = (status) => {
//     switch (status) {
//       case "open":
//         return "Open";
//       case "investigating":
//         return "Investigating";
//       case "resolved":
//         return "Resolved";
//       case "closed":
//         return "Closed";
//       default:
//         return status;
//     }
//   };

//   const toDate = (timestamp) => {
//     if (!timestamp || !timestamp.seconds) return null;
//     return new Date(timestamp.seconds * 1000);
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold">Dispute Management</h1>
//         <p className="text-muted-foreground">
//           Review and resolve user disputes
//         </p>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>All Disputes</CardTitle>
//           <CardDescription>
//             Manage and resolve disputes filed by users
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {/* Filters */}
//           <div className="flex flex-col sm:flex-row gap-4 mb-6">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search disputes..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             <Select value={statusFilter} onValueChange={setStatusFilter}>
//               <SelectTrigger className="w-full sm:w-[180px]">
//                 <SelectValue placeholder="Filter by status" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Statuses</SelectItem>
//                 <SelectItem value="open">Open</SelectItem>
//                 <SelectItem value="investigating">Investigating</SelectItem>
//                 <SelectItem value="resolved">Resolved</SelectItem>
//                 <SelectItem value="closed">Closed</SelectItem>
//               </SelectContent>
//             </Select>
//             <Select value={priorityFilter} onValueChange={setPriorityFilter}>
//               <SelectTrigger className="w-full sm:w-[180px]">
//                 <SelectValue placeholder="Filter by priority" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Priorities</SelectItem>
//                 <SelectItem value="high">High</SelectItem>
//                 <SelectItem value="medium">Medium</SelectItem>
//                 <SelectItem value="low">Low</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {loading ? (
//             <div className="space-y-2">
//               <Skeleton className="h-10 w-full" />
//               <Skeleton className="h-10 w-full" />
//               <Skeleton className="h-10 w-full" />
//             </div>
//           ) : filteredDisputes.length > 0 ? (
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Subject</TableHead>
//                   <TableHead>Deal</TableHead>
//                   <TableHead>Filed By</TableHead>
//                   <TableHead>Priority</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Date</TableHead>
//                   <TableHead></TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredDisputes.map((dispute) => (
//                   <TableRow key={dispute.id}>
//                     <TableCell className="font-medium">
//                       {dispute.subject}
//                     </TableCell>
//                     <TableCell>
//                       <div>
//                         <div className="font-medium">{dispute.dealTitle}</div>
//                         <div className="text-sm text-muted-foreground">
//                           {dispute.category}
//                         </div>
//                       </div>
//                     </TableCell>
//                     <TableCell>{dispute.disputedByEmail}</TableCell>
//                     <TableCell>
//                       <Badge variant={getPriorityVariant(dispute.priority)}>
//                         {dispute.priority
//                           ? dispute.priority.charAt(0).toUpperCase() +
//                             dispute.priority.slice(1)
//                           : ""}
//                       </Badge>
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant={getStatusVariant(dispute.status)}>
//                         {getStatusLabel(dispute.status)}
//                       </Badge>
//                     </TableCell>
//                     <TableCell>
//                       {toDate(dispute.createdAt)
//                         ? format(toDate(dispute.createdAt), "PPP")
//                         : "N/A"}
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <Button variant="ghost" size="icon" asChild>
//                         <Link href={`/admin/disputes/${dispute.id}`}>
//                           <ArrowRight className="h-4 w-4" />
//                         </Link>
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           ) : (
//             <div className="text-center py-12">
//               <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//               <h3 className="text-lg font-semibold">No disputes found</h3>
//               <p className="text-muted-foreground">
//                 {searchTerm ||
//                 statusFilter !== "all" ||
//                 priorityFilter !== "all"
//                   ? "Try adjusting your filters"
//                   : "No disputes have been filed yet"}
//               </p>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
