// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/contexts/AuthContext";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   ArrowDown,
//   ArrowUp,
//   Copy,
//   Eye,
//   EyeOff,
//   RefreshCw,
//   Loader2,
// } from "lucide-react";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";

// export default function WalletPage() {
//   const { user, loading: authLoading, refresh } = useAuth();
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [balanceVisible, setBalanceVisible] = useState(false);
//   const [transactions, setTransactions] = useState([]);
//   const [transactionsLoading, setTransactionsLoading] = useState(false);
//   const [showFundModal, setShowFundModal] = useState(false);
//   const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
//   const [virtualAccount, setVirtualAccount] = useState(null);
//   const [formData, setFormData] = useState({
//     email: "",
//     firstName: "",
//     lastName: "",
//     phone: "",
//   });
//   const [isCreatingAccount, setIsCreatingAccount] = useState(false);
//   const [createAccountStatus, setCreateAccountStatus] = useState(null);
//   const { toast } = useToast();
//   const router = useRouter();

//   // Load user data from backend
//   useEffect(() => {
//     if (!user) {
//       if (!authLoading) router.push("/login");
//       return;
//     }

//     const loadUserData = async () => {
//       try {
//         const res = await fetch("/api/users/me");
//         if (res.ok) {
//           const data = await res.json();
//           setUserData(data);

//           // Pre-fill form with user data
//           setFormData({
//             email: data.email || "",
//             firstName: data.displayName?.split(" ")[0] || "",
//             lastName: data.displayName?.split(" ").slice(-1)[0] || "",
//             phone: data.phone || "",
//           });

//           // Check if user already has an account number
//           if (data.accountNumber) {
//             setVirtualAccount({
//               virtualAccountNumber: data.accountNumber,
//               bankName: data.bankName || "FCMB",
//             });
//           } else {
//             // If no account number, check if virtual account exists via FCMB
//             await checkVirtualAccount();
//           }
//         }
//       } catch (err) {
//         console.error("Failed to load user data", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadUserData();
//     fetchTransactions();
//   }, [user, authLoading, router]);

//   const fetchTransactions = async () => {
//     if (!user) return;
//     setTransactionsLoading(true);
//     try {
//       const res = await fetch("/api/wallet/transactions");
//       if (res.ok) {
//         const data = await res.json();
//         // FCMB returns transactions in data.transactions array
//         setTransactions(data.transactions || []);
//       }
//     } catch (err) {
//       console.error("Failed to fetch transactions:", err);
//       setTransactions([]);
//     } finally {
//       setTransactionsLoading(false);
//     }
//   };

//   const handleRefreshBalance = async () => {
//     setIsRefreshing(true);
//     await Promise.all([refresh(), fetchTransactions()]);
//     toast({ title: "Refreshed", description: "Wallet updated." });
//     setIsRefreshing(false);
//   };

//   const checkVirtualAccount = async () => {
//     try {
//       const res = await fetch("/api/virtual-account/check");
//       const data = await res.json();

//       // FCMB returns { virtualAccount: null } or { virtualAccount: { ... } }
//       if (data.virtualAccount) {
//         setVirtualAccount(data.virtualAccount);
//       } else if (userData?.accountNumber) {
//         // Fallback to Firestore data
//         setVirtualAccount({
//           virtualAccountNumber: userData.accountNumber,
//           bankName: userData.bankName || "FCMB",
//         });
//       }
//     } catch (err) {
//       console.error("Failed to check virtual account:", err);
//     }
//   };

//   const handleCreateAccount = async (e) => {
//     e.preventDefault();
//     setIsCreatingAccount(true);
//     try {
//       const res = await fetch("/api/virtual-account/create", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData),
//       });
//       const data = await res.json();

//       // FCMB returns { success: true, data: { ... } } on success
//       if (res.ok && data.success) {
//         // Refresh user data to get the new account number
//         await refresh();

//         // Update local state
//         const updatedUserRes = await fetch("/api/users/me");
//         if (updatedUserRes.ok) {
//           const updatedUserData = await updatedUserRes.json();
//           setUserData(updatedUserData);

//           if (updatedUserData.accountNumber) {
//             setVirtualAccount({
//               virtualAccountNumber: updatedUserData.accountNumber,
//               bankName: updatedUserData.bankName || "FCMB",
//             });
//           }
//         }

//         setCreateAccountStatus("success");
//         setShowCreateAccountModal(false);
//         setShowFundModal(true);

//         toast({
//           title: "Virtual Account Created",
//           description: "Your virtual account has been successfully created.",
//         });
//       } else {
//         throw new Error(
//           data.error || data.message || "Failed to create virtual account"
//         );
//       }
//     } catch (err) {
//       setCreateAccountStatus("failed");
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: err.message,
//       });
//     } finally {
//       setIsCreatingAccount(false);
//     }
//   };

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text).then(() => {
//       toast({
//         title: "Copied!",
//         description: "Account number copied to clipboard.",
//       });
//     });
//   };

//   const handleFundClick = async () => {
//     // Always check virtual account status before showing fund modal
//     await checkVirtualAccount();
//     setShowFundModal(true);
//   };

//   if (authLoading || loading) {
//     return (
//       <div className="space-y-6">
//         <Skeleton className="h-96 w-full" />
//         <Skeleton className="h-64 w-full" />
//       </div>
//     );
//   }

//   if (!user) return null;

//   const kycStatus = userData?.kycStatus || "pending";
//   const walletBalance = Number(userData?.walletBalance) || 0;

//   if (kycStatus !== "approved") {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>KYC Required</CardTitle>
//           <CardDescription>
//             Your KYC is {kycStatus}. Complete KYC to access wallet features.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Button onClick={() => router.push("/kyc")}>
//             {kycStatus === "rejected" ? "Resubmit" : "Complete"} KYC
//           </Button>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <Card className="my-0">
//         <CardHeader>
//           <div className="flex flex-col md:flex-row justify-between items-start gap-4">
//             <div>
//               <CardTitle className="font-headline text-2xl">Wallet</CardTitle>
//               <CardDescription>
//                 Manage your funds and view transaction history.
//               </CardDescription>
//             </div>
//             <div className="flex gap-2">
//               <div className="bg-green-500 rounded-lg py-1 px-4 text-center text-white">
//                 KYC Verified
//               </div>
//               <Button
//                 onClick={handleRefreshBalance}
//                 variant="outline"
//                 size="sm"
//                 disabled={isRefreshing}
//               >
//                 {isRefreshing ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : (
//                   <RefreshCw className="mr-2 h-4 w-4" />
//                 )}
//                 Refresh
//               </Button>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="grid md:grid-cols-2 gap-6">
//           <div className="bg-gray-50 text-primary-blue p-6 rounded-lg flex flex-col justify-between">
//             <div>
//               <div className="flex items-center justify-between mb-2">
//                 <p className="text-sm opacity-80">Available Balance</p>
//                 <Button
//                   variant="ghost"
//                   size="icon"
//                   className="h-8 w-8 hover:bg-primary-foreground/20"
//                   onClick={() => setBalanceVisible(!balanceVisible)}
//                 >
//                   {balanceVisible ? (
//                     <EyeOff className="h-4 w-4" />
//                   ) : (
//                     <Eye className="h-4 w-4" />
//                   )}
//                 </Button>
//               </div>
//               <p className="text-4xl font-bold font-headline tracking-wider">
//                 {balanceVisible
//                   ? `₦${walletBalance.toLocaleString(undefined, {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}`
//                   : "₦••••••"}
//               </p>
//             </div>
//             <div className="flex gap-2 mt-4">
//               <Button
//                 variant="secondary"
//                 className="flex-1"
//                 onClick={handleFundClick}
//               >
//                 <ArrowDown className="mr-2 h-4 w-4" /> Fund
//               </Button>
//               <Button className="flex-1 bg-green-600">
//                 <ArrowUp className="mr-2 h-4 w-4" /> Withdraw
//               </Button>
//             </div>
//           </div>

//           {/* Virtual Account Display */}
//           {virtualAccount && (
//             <div className="bg-muted p-6 rounded-lg">
//               <h3 className="font-semibold mb-4">Your Funding Account</h3>
//               <p className="text-sm text-secondary-blue mb-2">
//                 To deposit funds, transfer money to this account:
//               </p>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between p-3 bg-background rounded-md">
//                   <span className="text-secondary-blue text-sm">
//                     Account Number
//                   </span>
//                   <div className="flex items-center gap-2">
//                     <strong className="font-mono">
//                       {virtualAccount.virtualAccountNumber}
//                     </strong>
//                     <Button
//                       size="icon"
//                       variant="ghost"
//                       className="h-7 w-7"
//                       onClick={() =>
//                         copyToClipboard(virtualAccount.virtualAccountNumber)
//                       }
//                     >
//                       <Copy className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </div>
//                 <div className="flex items-center justify-between p-3 bg-background rounded-md">
//                   <span className="text-secondary-blue text-sm">Bank Name</span>
//                   <strong className="font-mono">
//                     {virtualAccount.bankName}
//                   </strong>
//                 </div>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle>Transaction History</CardTitle>
//           <CardDescription>Recent transactions on your wallet</CardDescription>
//         </CardHeader>
//         <CardContent>
//           {transactionsLoading ? (
//             <div className="space-y-4">
//               {[...Array(5)].map((_, i) => (
//                 <Skeleton key={i} className="h-12 w-full" />
//               ))}
//             </div>
//           ) : transactions.length > 0 ? (
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Date</TableHead>
//                   <TableHead>Description</TableHead>
//                   <TableHead>Amount</TableHead>
//                   <TableHead>Status</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {transactions.map((transaction, index) => (
//                   <TableRow key={transaction.id || index}>
//                     <TableCell>
//                       {transaction.date
//                         ? new Date(transaction.date).toLocaleString()
//                         : "N/A"}
//                     </TableCell>
//                     <TableCell>
//                       {transaction.description ||
//                         transaction.narration ||
//                         "Transaction"}
//                     </TableCell>
//                     <TableCell
//                       className={
//                         transaction.type === "credit" || transaction.amount > 0
//                           ? "text-green-500"
//                           : "text-red-500"
//                       }
//                     >
//                       {transaction.type === "credit" || transaction.amount > 0
//                         ? "+"
//                         : "-"}
//                       ₦
//                       {Math.abs(Number(transaction.amount) || 0).toLocaleString(
//                         undefined,
//                         {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         }
//                       )}
//                     </TableCell>
//                     <TableCell>
//                       <Badge
//                         variant={
//                           transaction.status === "success" ||
//                           transaction.status === "SUCCESS"
//                             ? "default"
//                             : transaction.status === "failed" ||
//                                 transaction.status === "FAILED"
//                               ? "destructive"
//                               : "secondary"
//                         }
//                       >
//                         {transaction.status?.toLowerCase() || "pending"}
//                       </Badge>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           ) : (
//             <div className="text-center py-8 text-secondary-blue">
//               No transactions found
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Fund Wallet Modal */}
//       <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Fund Your Wallet</DialogTitle>
//             <DialogDescription>
//               {virtualAccount
//                 ? "Transfer money to this account to fund your wallet. Funds will be automatically credited to your wallet balance."
//                 : "You need a virtual account to fund your wallet."}
//             </DialogDescription>
//           </DialogHeader>
//           {virtualAccount ? (
//             <div className="space-y-3">
//               <div className="flex items-center justify-between p-3 bg-background rounded-md">
//                 <span className="text-secondary-blue text-sm">
//                   Account Number
//                 </span>
//                 <div className="flex items-center gap-2">
//                   <strong className="font-mono">
//                     {virtualAccount.virtualAccountNumber}
//                   </strong>
//                   <Button
//                     size="icon"
//                     variant="ghost"
//                     className="h-7 w-7"
//                     onClick={() =>
//                       copyToClipboard(virtualAccount.virtualAccountNumber)
//                     }
//                   >
//                     <Copy className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//               <div className="flex items-center justify-between p-3 bg-background rounded-md">
//                 <span className="text-secondary-blue text-sm">Bank Name</span>
//                 <strong className="font-mono">{virtualAccount.bankName}</strong>
//               </div>
//               <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
//                 <p>
//                   💡 <strong>Note:</strong> Transfers to this account may take a
//                   few minutes to reflect in your wallet balance.
//                 </p>
//               </div>
//             </div>
//           ) : (
//             <DialogFooter>
//               <Button onClick={() => setShowCreateAccountModal(true)}>
//                 Create Virtual Account
//               </Button>
//             </DialogFooter>
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Create Virtual Account Modal */}
//       <Dialog
//         open={showCreateAccountModal}
//         onOpenChange={setShowCreateAccountModal}
//       >
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Create Virtual Account</DialogTitle>
//             <DialogDescription>
//               Create a virtual account with FCMB to fund your wallet. This
//               account will be linked to your profile.
//             </DialogDescription>
//           </DialogHeader>
//           <form onSubmit={handleCreateAccount} className="space-y-4">
//             <div>
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={(e) =>
//                   setFormData({ ...formData, email: e.target.value })
//                 }
//                 required
//                 disabled={isCreatingAccount}
//               />
//             </div>
//             <div>
//               <Label htmlFor="firstName">First Name</Label>
//               <Input
//                 id="firstName"
//                 value={formData.firstName}
//                 onChange={(e) =>
//                   setFormData({ ...formData, firstName: e.target.value })
//                 }
//                 required
//                 disabled={isCreatingAccount}
//               />
//             </div>
//             <div>
//               <Label htmlFor="lastName">Last Name</Label>
//               <Input
//                 id="lastName"
//                 value={formData.lastName}
//                 onChange={(e) =>
//                   setFormData({ ...formData, lastName: e.target.value })
//                 }
//                 required
//                 disabled={isCreatingAccount}
//               />
//             </div>
//             <div>
//               <Label htmlFor="phone">Phone Number</Label>
//               <Input
//                 id="phone"
//                 value={formData.phone}
//                 onChange={(e) =>
//                   setFormData({ ...formData, phone: e.target.value })
//                 }
//                 required
//                 disabled={isCreatingAccount}
//               />
//             </div>
//             <DialogFooter>
//               <Button type="submit" disabled={isCreatingAccount}>
//                 {isCreatingAccount ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : null}
//                 {isCreatingAccount ? "Creating..." : "Create Account"}
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       {/* Account Creation Status Modal */}
//       <Dialog
//         open={createAccountStatus !== null}
//         onOpenChange={() => setCreateAccountStatus(null)}
//       >
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>
//               {createAccountStatus === "success"
//                 ? "Virtual Account Created"
//                 : "Failed to Create Account"}
//             </DialogTitle>
//             <DialogDescription>
//               {createAccountStatus === "success"
//                 ? "Your virtual account has been successfully created and linked to your profile."
//                 : "There was an error creating your virtual account. Please try again."}
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button
//               onClick={() => {
//                 setCreateAccountStatus(null);
//                 if (createAccountStatus === "success") {
//                   setShowFundModal(true);
//                 }
//               }}
//             >
//               {createAccountStatus === "success" ? "View Account" : "Close"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
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
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function WalletPage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [createAccountStatus, setCreateAccountStatus] = useState(null);
  const { toast } = useToast();
  const router = useRouter();

  // Load user data from backend
  useEffect(() => {
    if (!user) {
      if (!authLoading) router.push("/login");
      return;
    }

    const loadUserData = async () => {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
          console.log("📊 User data loaded:", data);

          // ALWAYS check user data first - this comes from Firestore
          if (data.accountNumber) {
            console.log(
              "✅ Found account number in user data:",
              data.accountNumber
            );
            setVirtualAccount({
              virtualAccountNumber: data.accountNumber,
              bankName: data.bankName || "FCMB",
            });
            setLoading(false);
            return; // Stop here if we have the account number
          } else {
            console.log("❌ No account number found in user data");
            // Only then check the FCMB API
            await checkVirtualAccount();
          }
        }
      } catch (err) {
        console.error("Failed to load user data", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    fetchTransactions();
  }, [user, authLoading, router]);

  const fetchTransactions = async () => {
    if (!user) return;
    setTransactionsLoading(true);
    try {
      const res = await fetch("/api/transactions"); // Changed to new endpoint
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    await Promise.all([refresh(), fetchTransactions()]);

    // Also reload user data to get any updates
    const res = await fetch("/api/users/me");
    if (res.ok) {
      const data = await res.json();
      setUserData(data);
      if (data.accountNumber) {
        setVirtualAccount({
          virtualAccountNumber: data.accountNumber,
          bankName: data.bankName || "FCMB",
        });
      }
    }

    toast({ title: "Refreshed", description: "Wallet updated." });
    setIsRefreshing(false);
  };

  const checkVirtualAccount = async () => {
    try {
      const res = await fetch("/api/virtual-account/check");
      const data = await res.json();
      console.log("🔍 Virtual account check response:", data);

      if (data.virtualAccount) {
        const fcmbAccount = data.virtualAccount;
        console.log("📋 FCMB account details:", fcmbAccount);

        // FCMB returns 'virtualAccountId' but we need 'virtualAccountNumber'
        if (fcmbAccount.virtualAccountId) {
          console.log(
            "✅ Found FCMB virtual account ID:",
            fcmbAccount.virtualAccountId
          );
          setVirtualAccount({
            virtualAccountNumber: fcmbAccount.virtualAccountId, // Map virtualAccountId to virtualAccountNumber
            bankName: fcmbAccount.bankName || "FCMB",
          });
        }
      } else if (userData?.accountNumber) {
        // Fallback to Firestore data
        console.log(
          "🔄 Falling back to Firestore account number:",
          userData.accountNumber
        );
        setVirtualAccount({
          virtualAccountNumber: userData.accountNumber,
          bankName: userData.bankName || "FCMB",
        });
      }
    } catch (err) {
      console.error("Failed to check virtual account:", err);
      if (userData?.accountNumber) {
        setVirtualAccount({
          virtualAccountNumber: userData.accountNumber,
          bankName: userData.bankName || "FCMB",
        });
      }
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setIsCreatingAccount(true);
    try {
      const res = await fetch("/api/virtual-account/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      console.log("📦 Virtual account creation response:", data); // Debug log

      if (res.ok && data.success) {
        console.log("✅ Virtual account created successfully");

        // Refresh the auth context and user data
        await refresh();

        // Reload user data to get the updated account number
        const updatedUserRes = await fetch("/api/users/me");
        if (updatedUserRes.ok) {
          const updatedUserData = await updatedUserRes.json();
          console.log(
            "🔄 Updated user data after account creation:",
            updatedUserData
          ); // Debug log
          setUserData(updatedUserData);

          if (updatedUserData.accountNumber) {
            console.log(
              "🎯 Setting virtual account with number:",
              updatedUserData.accountNumber
            ); // Debug log
            setVirtualAccount({
              virtualAccountNumber: updatedUserData.accountNumber,
              bankName: updatedUserData.bankName || "FCMB",
            });
          }
        }

        setCreateAccountStatus("success");
        setShowCreateAccountModal(false);
        setShowFundModal(true);

        toast({
          title: "Virtual Account Created",
          description: "Your virtual account has been successfully created.",
        });
      } else {
        throw new Error(
          data.error || data.message || "Failed to create virtual account"
        );
      }
    } catch (err) {
      console.error("❌ Virtual account creation error:", err);
      setCreateAccountStatus("failed");
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No account number to copy",
      });
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Account number copied to clipboard.",
      });
    });
  };

  const handleFundClick = async () => {
    // Always check virtual account status before showing fund modal
    await checkVirtualAccount();
    setShowFundModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) return null;

  const kycStatus = userData?.kycStatus || "pending";
  const walletBalance = Number(userData?.walletBalance) || 0;

  if (kycStatus !== "approved") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Required</CardTitle>
          <CardDescription>
            Your KYC is {kycStatus}. Complete KYC to access wallet features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/kyc")}>
            {kycStatus === "rejected" ? "Resubmit" : "Complete"} KYC
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="my-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="font-headline text-2xl">Wallet</CardTitle>
              <CardDescription>
                Manage your funds and view transaction history.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="bg-green-500 rounded-lg py-1 px-4 text-center text-white">
                KYC Verified
              </div>
              <Button
                onClick={handleRefreshBalance}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 text-primary-blue p-6 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm opacity-80">Available Balance</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary-foreground/20"
                  onClick={() => setBalanceVisible(!balanceVisible)}
                >
                  {balanceVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-4xl font-bold font-headline tracking-wider">
                {balanceVisible
                  ? `₦${walletBalance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "₦••••••"}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleFundClick}
              >
                <ArrowDown className="mr-2 h-4 w-4" /> Fund
              </Button>
              <Button className="flex-1 bg-green-600">
                <ArrowUp className="mr-2 h-4 w-4" /> Withdraw
              </Button>
            </div>
          </div>

          {/* Virtual Account Display */}
          {virtualAccount && virtualAccount.virtualAccountNumber ? (
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="font-semibold mb-4">Your Funding Account</h3>
              <p className="text-sm text-secondary-blue mb-2">
                To deposit funds, transfer money to this account:
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded-md">
                  <span className="text-secondary-blue text-sm">
                    Account Number
                  </span>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono">
                      {virtualAccount.virtualAccountNumber}
                    </strong>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() =>
                        copyToClipboard(virtualAccount.virtualAccountNumber)
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-md">
                  <span className="text-secondary-blue text-sm">Bank Name</span>
                  <strong className="font-mono">
                    {virtualAccount.bankName}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-6 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-secondary-blue mb-2">
                  No virtual account found
                </p>
                <Button
                  onClick={() => setShowCreateAccountModal(true)}
                  size="sm"
                >
                  Create Virtual Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rest of your component remains the same */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent transactions on your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={transaction.id || index}>
                    <TableCell>
                      {transaction.date
                        ? new Date(transaction.date).toLocaleString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {transaction.description ||
                        transaction.narration ||
                        "Transaction"}
                    </TableCell>
                    <TableCell
                      className={
                        transaction.type === "credit" || transaction.amount > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {transaction.type === "credit" || transaction.amount > 0
                        ? "+"
                        : "-"}
                      ₦
                      {Math.abs(Number(transaction.amount) || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === "success" ||
                          transaction.status === "SUCCESS"
                            ? "default"
                            : transaction.status === "failed" ||
                                transaction.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {transaction.status?.toLowerCase() || "pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-secondary-blue">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fund Wallet Modal */}
      <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Your Wallet</DialogTitle>
            <DialogDescription>
              {virtualAccount && virtualAccount.virtualAccountNumber
                ? "Transfer money to this account to fund your wallet. Funds will be automatically credited to your wallet balance."
                : "You need a virtual account to fund your wallet."}
            </DialogDescription>
          </DialogHeader>
          {virtualAccount && virtualAccount.virtualAccountNumber ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-md">
                <span className="text-secondary-blue text-sm">
                  Account Number
                </span>
                <div className="flex items-center gap-2">
                  <strong className="font-mono">
                    {virtualAccount.virtualAccountNumber}
                  </strong>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() =>
                      copyToClipboard(virtualAccount.virtualAccountNumber)
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-md">
                <span className="text-secondary-blue text-sm">Bank Name</span>
                <strong className="font-mono">{virtualAccount.bankName}</strong>
              </div>
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
                <p>
                  💡 <strong>Note:</strong> Transfers to this account may take a
                  few minutes to reflect in your wallet balance.
                </p>
              </div>
            </div>
          ) : (
            <DialogFooter>
              <Button onClick={() => setShowCreateAccountModal(true)}>
                Create Virtual Account
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Virtual Account Modal - Same as before */}
      <Dialog
        open={showCreateAccountModal}
        onOpenChange={setShowCreateAccountModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Virtual Account</DialogTitle>
            <DialogDescription>
              Create a virtual account with FCMB to fund your wallet. This
              account will be linked to your profile.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isCreatingAccount}
              />
            </div>
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                disabled={isCreatingAccount}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
                disabled={isCreatingAccount}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                disabled={isCreatingAccount}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCreatingAccount}>
                {isCreatingAccount ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isCreatingAccount ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Creation Status Modal */}
      <Dialog
        open={createAccountStatus !== null}
        onOpenChange={() => setCreateAccountStatus(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createAccountStatus === "success"
                ? "Virtual Account Created"
                : "Failed to Create Account"}
            </DialogTitle>
            <DialogDescription>
              {createAccountStatus === "success"
                ? "Your virtual account has been successfully created and linked to your profile."
                : "There was an error creating your virtual account. Please try again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setCreateAccountStatus(null);
                if (createAccountStatus === "success") {
                  setShowFundModal(true);
                }
              }}
            >
              {createAccountStatus === "success" ? "View Account" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
