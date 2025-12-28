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
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { SearchableSelect } from "@/components/ui/searchable-select";

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
//   const [showWithdrawModal, setShowWithdrawModal] = useState(false);
//   const [banks, setBanks] = useState([]);
//   const [withdrawLoading, setWithdrawLoading] = useState(false);
//   const [withdrawForm, setWithdrawForm] = useState({
//     amount: "",
//     destinationAccount: "",
//     destinationBankCode: "",
//     destinationBankName: "",
//     narration: "",
//   });
//   const [banksLoading, setBanksLoading] = useState(false);
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
//           console.log("📊 User data loaded:", data);

//           // ALWAYS check user data first - this comes from Firestore
//           if (data.accountNumber) {
//             console.log(
//               "✅ Found account number in user data:",
//               data.accountNumber
//             );
//             setVirtualAccount({
//               virtualAccountNumber: data.accountNumber,
//               bankName: data.bankName || "FCMB",
//             });
//             setLoading(false);
//             return; // Stop here if we have the account number
//           } else {
//             console.log("❌ No account number found in user data");
//             // Only then check the FCMB API
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

//   useEffect(() => {
//     const loadBanks = async () => {
//       setBanksLoading(true);
//       try {
//         const res = await fetch("/api/banks", { credentials: "include" });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = await res.json();
//         console.log("Banks API response:", data); // ← This must show { banks: [...] }

//         if (Array.isArray(data.banks)) {
//           setBanks(data.banks);
//         } else {
//           console.error("Invalid banks format:", data);
//           setBanks([]);
//         }
//       } catch (err) {
//         console.error("Failed to load banks:", err);
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Could not load banks",
//         });
//       } finally {
//         setBanksLoading(false);
//       }
//     };

//     loadBanks();
//   }, []);

//   const fetchTransactions = async () => {
//     if (!user) return;
//     setTransactionsLoading(true);
//     try {
//       const res = await fetch("/api/transactions"); // Changed to new endpoint
//       if (res.ok) {
//         const data = await res.json();
//         setTransactions(data.transactions || []);
//       }
//     } catch (err) {
//       console.error("Failed to fetch transactions:", err);
//       setTransactions([]);
//     } finally {
//       setTransactionsLoading(false);
//     }
//   };

//   const handleBankSelect = (selectedBank) => {
//     console.log("🏦 Bank selected:", {
//       name: selectedBank.bankName,
//       bankCode: selectedBank.bankCode,
//       domBankCode: selectedBank.domBankCode,
//       type: selectedBank.bankType,
//     });

//     // Use domBankCode if available, otherwise use bankCode
//     const bankCodeToUse = selectedBank.domBankCode || selectedBank.bankCode;

//     setWithdrawForm({
//       ...withdrawForm,
//       destinationBankCode: String(bankCodeToUse), // Ensure it's a string
//       destinationBankName: selectedBank.bankName,
//     });
//   };

//   // Add this function to validate withdrawal form
//   const validateWithdrawalForm = (form) => {
//     const errors = [];

//     // Validate amount
//     const amount = Number(form.amount);
//     if (!amount || amount <= 0) {
//       errors.push("Amount must be greater than 0");
//     }

//     if (amount > (userData?.walletBalance || 0)) {
//       errors.push("Insufficient balance");
//     }

//     // Validate account number
//     if (!/^\d{10}$/.test(form.destinationAccount)) {
//       errors.push("Account number must be exactly 10 digits");
//     }

//     // Validate bank code
//     if (!form.destinationBankCode) {
//       errors.push("Please select a bank");
//     }

//     return errors;
//   };

//   const handleWithdraw = async (e) => {
//     e.preventDefault();

//     // Get CSRF token from cookie
//     const csrfToken = document.cookie
//       .split("; ")
//       .find((row) => row.startsWith("csrf-token="))
//       ?.split("=")[1];

//     if (!csrfToken) {
//       toast({
//         variant: "destructive",
//         title: "Session Error",
//         description: "CSRF token missing. Please refresh the page.",
//       });
//       return;
//     }

//     const amount = Number(withdrawForm.amount);
//     if (!amount || amount <= 0 || amount > (userData?.walletBalance || 0)) {
//       toast({
//         variant: "destructive",
//         description: "Invalid amount or insufficient balance",
//       });
//       return;
//     }

//     const cleanAccount = withdrawForm.destinationAccount.replace(/\D/g, "");
//     if (!/^\d{10}$/.test(cleanAccount)) {
//       toast({
//         variant: "destructive",
//         description: "Account number must be 10 digits",
//       });
//       return;
//     }

//     if (!withdrawForm.destinationBankCode) {
//       toast({ variant: "destructive", description: "Please select a bank" });
//       return;
//     }

//     setWithdrawLoading(true);

//     try {
//       const response = await fetch("/api/wallet/withdraw", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "x-csrf-token": csrfToken, // This is required
//         },
//         credentials: "include", // Important for cookies
//         body: JSON.stringify({
//           amount: amount.toFixed(2),
//           destinationAccount: cleanAccount,
//           destinationBankCode: withdrawForm.destinationBankCode, // No padding
//           narration: withdrawForm.narration || "Wallet withdrawal",
//         }),
//       });

//       const data = await response.json();

//       if (response.ok && data.success) {
//         toast({
//           title: "Withdrawal Initiated!",
//           description: "You’ll get an email when it’s completed.",
//         });
//         setShowWithdrawModal(false);
//         setWithdrawForm({
//           amount: "",
//           destinationAccount: "",
//           destinationBankCode: "",
//           destinationBankName: "",
//           narration: "",
//         });
//         setTimeout(() => {
//           handleRefreshBalance();
//           fetchTransactions();
//         }, 2000);
//       } else {
//         throw new Error(data.error || "Withdrawal failed");
//       }
//     } catch (err) {
//       console.error("Withdrawal error:", err);
//       toast({
//         variant: "destructive",
//         title: "Failed",
//         description: err.message || "Please try again",
//       });
//     } finally {
//       setWithdrawLoading(false);
//     }
//   };
//   const handleRefreshBalance = async () => {
//     setIsRefreshing(true);
//     await Promise.all([refresh(), fetchTransactions()]);

//     // Also reload user data to get any updates
//     const res = await fetch("/api/users/me");
//     if (res.ok) {
//       const data = await res.json();
//       setUserData(data);
//       if (data.accountNumber) {
//         setVirtualAccount({
//           virtualAccountNumber: data.accountNumber,
//           bankName: data.bankName || "FCMB",
//         });
//       }
//     }

//     toast({
//       title: "Refreshed",
//       className: "bg-white",
//       description: "Wallet updated.",
//     });
//     setIsRefreshing(false);
//   };

//   const checkVirtualAccount = async () => {
//     try {
//       const res = await fetch("/api/virtual-account/check");
//       const data = await res.json();
//       console.log("🔍 Virtual account check response:", data);

//       if (data.virtualAccount) {
//         const fcmbAccount = data.virtualAccount;
//         console.log("📋 FCMB account details:", fcmbAccount);

//         // FCMB returns 'virtualAccountId' but we need 'virtualAccountNumber'
//         if (fcmbAccount.virtualAccountId) {
//           console.log(
//             "✅ Found FCMB virtual account ID:",
//             fcmbAccount.virtualAccountId
//           );
//           setVirtualAccount({
//             virtualAccountNumber: fcmbAccount.virtualAccountId, // Map virtualAccountId to virtualAccountNumber
//             bankName: fcmbAccount.bankName || "FCMB",
//           });
//         }
//       } else if (userData?.accountNumber) {
//         // Fallback to Firestore data
//         console.log(
//           "🔄 Falling back to Firestore account number:",
//           userData.accountNumber
//         );
//         setVirtualAccount({
//           virtualAccountNumber: userData.accountNumber,
//           bankName: userData.bankName || "FCMB",
//         });
//       }
//     } catch (err) {
//       console.error("Failed to check virtual account:", err);
//       if (userData?.accountNumber) {
//         setVirtualAccount({
//           virtualAccountNumber: userData.accountNumber,
//           bankName: userData.bankName || "FCMB",
//         });
//       }
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
//       console.log("📦 Virtual account creation response:", data); // Debug log

//       if (res.ok && data.success) {
//         console.log("✅ Virtual account created successfully");

//         // Refresh the auth context and user data
//         await refresh();

//         // Reload user data to get the updated account number
//         const updatedUserRes = await fetch("/api/users/me");
//         if (updatedUserRes.ok) {
//           const updatedUserData = await updatedUserRes.json();
//           console.log(
//             "🔄 Updated user data after account creation:",
//             updatedUserData
//           ); // Debug log
//           setUserData(updatedUserData);

//           if (updatedUserData.accountNumber) {
//             console.log(
//               "🎯 Setting virtual account with number:",
//               updatedUserData.accountNumber
//             ); // Debug log
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
//           className: "bg-white",
//           description: "Your virtual account has been successfully created.",
//         });
//       } else {
//         throw new Error(
//           data.error || data.message || "Failed to create virtual account"
//         );
//       }
//     } catch (err) {
//       console.error("❌ Virtual account creation error:", err);
//       setCreateAccountStatus("failed");
//       toast({
//         variant: "destructive",
//         className: "bg-white",
//         title: "Error",
//         description: err.message,
//       });
//     } finally {
//       setIsCreatingAccount(false);
//     }
//   };

//   const copyToClipboard = (text) => {
//     if (!text) {
//       toast({
//         variant: "destructive",
//         className: "bg-white",
//         title: "Error",
//         description: "No account number to copy",
//       });
//       return;
//     }
//     navigator.clipboard.writeText(text).then(() => {
//       toast({
//         title: "Copied!",
//         className: "bg-white",
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
//       <Card className="bg-white">
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
//     <div className="space-y-6 font-headline">
//       <Card className="my-0 bg-white p-4 border-b-4 border-b-primary-blue">
//         <CardHeader>
//           <div className="flex flex-col md:flex-row justify-between items-start gap-4">
//             <div>
//               <CardTitle className="font-headline font-bold text-2xl">
//                 Wallet
//               </CardTitle>
//               <CardDescription>
//                 Manage your funds and view transaction history.
//               </CardDescription>
//             </div>
//             <div className="flex gap-2">
//               <div className="bg-green-600 rounded-lg flex items-center justify-center px-4 text-sm  text-center text-white">
//                 KYC Verified
//               </div>
//               <Button
//                 onClick={handleRefreshBalance}
//                 variant="outline"
//                 size="sm"
//                 disabled={isRefreshing}
//               >
//                 {isRefreshing ? (
//                   <Loader2 className=" h-4 w-4 animate-spin" />
//                 ) : (
//                   <RefreshCw className=" text-center h-4 w-4" />
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
//               <Button
//                 className="flex-1 bg-green-600 hover:bg-green-700"
//                 onClick={() => setShowWithdrawModal(true)}
//               >
//                 <ArrowUp className="mr-2 h-4 w-4" /> Withdraw
//               </Button>
//             </div>
//           </div>

//           {/* Virtual Account Display */}
//           {virtualAccount && virtualAccount.virtualAccountNumber ? (
//             <div className="bg-muted p-6 rounded-lg">
//               <h3 className="font-semibold mb-4">Your Funding Account</h3>
//               <p className="text-sm text-secondary-blue mb-2">
//                 To deposit funds, transfer money to this account:
//               </p>
//               <div className="">
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
//                     {virtualAccount.bankName} MFB
//                   </strong>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="bg-muted p-6 rounded-lg flex items-center justify-center">
//               <div className="text-center">
//                 <p className="text-sm text-secondary-blue mb-2">
//                   No virtual account found
//                 </p>
//                 <Button
//                   onClick={() => setShowCreateAccountModal(true)}
//                   size="sm"
//                 >
//                   Create Virtual Account
//                 </Button>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       <Card className="p-0 py-4 md:p-4 bg-white">
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
//             <Table className="text-xs">
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Date</TableHead>
//                   <TableHead className="pl-4">Description</TableHead>
//                   <TableHead>Amount</TableHead>
//                   <TableHead className="text-right pr-4 ">Status</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {transactions.map((transaction, index) => (
//                   <TableRow key={transaction.id || index}>
//                     <TableCell className="w-4">
//                       {transaction.date
//                         ? new Date(transaction.date).toLocaleString()
//                         : "N/A"}
//                     </TableCell>
//                     <TableCell className="pl-4">
//                       {transaction.description ||
//                         transaction.narration ||
//                         "Transaction"}
//                     </TableCell>
//                     <TableCell
//                       className={
//                         transaction.type === "debit" ||
//                         transaction.amount < 0 ||
//                         transaction.direction === "outgoing"
//                           ? "text-red-600 font-medium"
//                           : "text-green-600 font-medium"
//                       }
//                     >
//                       <div className="flex items-center gap-1.5">
//                         {transaction.type === "debit" ||
//                         transaction.amount < 0 ||
//                         transaction.direction === "outgoing" ? (
//                           <>
//                             <ArrowDown className="h-4 w-4 text-red-600" />
//                             <span>
//                               -₦
//                               {Math.abs(
//                                 Number(transaction.amount || 0)
//                               ).toLocaleString("en-NG", {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </span>
//                           </>
//                         ) : (
//                           <>
//                             <ArrowUp className="h-4 w-4 text-green-600" />
//                             <span>
//                               +₦
//                               {Number(transaction.amount || 0).toLocaleString(
//                                 "en-NG",
//                                 {
//                                   minimumFractionDigits: 2,
//                                   maximumFractionDigits: 2,
//                                 }
//                               )}
//                             </span>
//                           </>
//                         )}
//                       </div>
//                     </TableCell>
//                     <TableCell className="text-right">
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
//               {virtualAccount && virtualAccount.virtualAccountNumber
//                 ? "Transfer money to this account to fund your wallet. Funds will be automatically credited to your wallet balance."
//                 : "You need a virtual account to fund your wallet."}
//             </DialogDescription>
//           </DialogHeader>
//           {virtualAccount && virtualAccount.virtualAccountNumber ? (
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
//                 <strong className="font-mono">
//                   {virtualAccount.bankName} MFB
//                 </strong>
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

//       {/* Create Virtual Account Modal - Same as before */}
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
//       {/* Withdrawal Modal */}
//       <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>Withdraw Funds</DialogTitle>
//             <DialogDescription>
//               Transfer money from your wallet to any bank account in Nigeria.
//             </DialogDescription>
//           </DialogHeader>

//           <form onSubmit={handleWithdraw} className="space-y-4">
//             {/* Amount Input */}
//             <div className="space-y-2">
//               <Label htmlFor="amount">Amount (₦)</Label>
//               <Input
//                 id="amount"
//                 type="number"
//                 placeholder="0.00"
//                 value={withdrawForm.amount}
//                 onChange={(e) =>
//                   setWithdrawForm({ ...withdrawForm, amount: e.target.value })
//                 }
//                 required
//                 min="1"
//                 step="0.01"
//               />
//               {userData?.walletBalance && (
//                 <p className="text-sm text-gray-500">
//                   Current Balance: ₦
//                   {userData.walletBalance.toLocaleString(undefined, {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//               )}
//             </div>
//             {/* Bank Selection */}

//             <div className="space-y-2">
//               <Label htmlFor="bank">Bank</Label>
//               <SearchableSelect
//                 options={banks.map((bank) => ({
//                   value: bank.bankCode,
//                   label: bank.bankName,
//                 }))}
//                 value={withdrawForm.destinationBankCode}
//                 onValueChange={(selectedValue) => {
//                   const bank = banks.find((b) => b.bankCode === selectedValue);
//                   if (bank) {
//                     setWithdrawForm({
//                       ...withdrawForm,
//                       destinationBankCode: bank.bankCode,
//                       destinationBankName: bank.bankName,
//                     });
//                   }
//                 }}
//                 placeholder="Search and select bank..."
//                 disabled={banksLoading}
//               />

//               {/* Show selected bank */}
//               {withdrawForm.destinationBankName && (
//                 <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
//                   <div className="flex justify-between">
//                     <span className="font-medium">
//                       {withdrawForm.destinationBankName}
//                     </span>
//                     <span className="text-gray-500">
//                       Code: {withdrawForm.destinationBankCode}
//                     </span>
//                   </div>
//                 </div>
//               )}

//               {banksLoading && (
//                 <div className="flex items-center gap-2 text-sm text-gray-500">
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   Loading banks...
//                 </div>
//               )}

//               {/* Show selected bank details */}
//               {/* {withdrawForm.destinationBankName && (
//                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm">
//                   <div>
//                     <span className="text-gray-600">Selected: </span>
//                     <span className="font-medium">
//                       {withdrawForm.destinationBankName}
//                     </span>
//                   </div>
//                   <span className="text-gray-500 text-xs">
//                     Code: {withdrawForm.destinationBankCode}
//                   </span>
//                 </div>
//               )} */}
//             </div>

//             {/* Account Number */}
//             <div className="space-y-2">
//               <Label htmlFor="accountNumber">Account Number</Label>
//               <Input
//                 id="accountNumber"
//                 type="text"
//                 placeholder="Enter account number"
//                 value={withdrawForm.destinationAccount}
//                 onChange={(e) =>
//                   setWithdrawForm({
//                     ...withdrawForm,
//                     destinationAccount: e.target.value,
//                   })
//                 }
//                 required
//               />
//             </div>
//             {/* Narration */}
//             <div className="space-y-2">
//               <Label htmlFor="narration">Description (Optional)</Label>
//               <Input
//                 id="narration"
//                 type="text"
//                 placeholder="Withdrawal description"
//                 value={withdrawForm.narration}
//                 onChange={(e) =>
//                   setWithdrawForm({
//                     ...withdrawForm,
//                     narration: e.target.value,
//                   })
//                 }
//               />
//             </div>
//             <DialogFooter>
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setShowWithdrawModal(false)}
//                 disabled={withdrawLoading}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 disabled={withdrawLoading}
//                 className="bg-green-600 hover:bg-green-700"
//               >
//                 {withdrawLoading ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Processing...
//                   </>
//                 ) : (
//                   "Withdraw"
//                 )}
//               </Button>
//             </DialogFooter>
//           </form>

//           <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
//             <p>
//               💡 <strong>Note:</strong> Withdrawals may take a few minutes to
//               process. You'll receive an email notification when completed.
//             </p>
//           </div>
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
  ShieldCheck,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/ui/searchable-select";

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
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [banks, setBanks] = useState([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    destinationAccount: "",
    destinationBankCode: "",
    destinationBankName: "",
    narration: "",
  });
  const [banksLoading, setBanksLoading] = useState(false);

  // OTP STATES
  const [withdrawStep, setWithdrawStep] = useState(1); // 1: Verify Identity, 2: Withdrawal Form
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

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
          if (data.accountNumber) {
            setVirtualAccount({
              virtualAccountNumber: data.accountNumber,
              bankName: data.bankName || "FCMB",
            });
            setLoading(false);
            return;
          } else {
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

  useEffect(() => {
    const loadBanks = async () => {
      setBanksLoading(true);
      try {
        const res = await fetch("/api/banks", { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.banks)) {
          setBanks(data.banks);
        }
      } catch (err) {
        console.error("Failed to load banks:", err);
      } finally {
        setBanksLoading(false);
      }
    };
    loadBanks();
  }, []);

  const fetchTransactions = async () => {
    if (!user) return;
    setTransactionsLoading(true);
    try {
      const res = await fetch("/api/transactions");
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

  // OTP HANDLERS
  const handleSendOTP = async () => {
    setOtpLoading(true);
    try {
      const res = await fetch("/api/wallet/withdraw/send-otp", {
        method: "POST",
      });
      if (res.ok) {
        setOtpSent(true);
        toast({
          title: "OTP Sent",
          description: "Verification code sent to your email.",
        });
      } else {
        throw new Error("Failed to send verification code");
      }
    } catch (err) {
      toast({ variant: "destructive", description: err.message });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpLoading(true);
    try {
      const res = await fetch("/api/wallet/withdraw/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      if (res.ok) {
        setWithdrawStep(2);
        toast({
          title: "Identity Verified",
          description: "You can now fill the withdrawal form.",
        });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Invalid verification code");
      }
    } catch (err) {
      toast({ variant: "destructive", description: err.message });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const csrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrf-token="))
      ?.split("=")[1];

    if (!csrfToken) {
      toast({
        variant: "destructive",
        title: "Session Error",
        description: "Please refresh the page.",
      });
      return;
    }

    const amount = Number(withdrawForm.amount);
    const cleanAccount = withdrawForm.destinationAccount.replace(/\D/g, "");

    setWithdrawLoading(true);
    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          amount: amount.toFixed(2),
          destinationAccount: cleanAccount,
          destinationBankCode: withdrawForm.destinationBankCode,
          narration: withdrawForm.narration || "Wallet withdrawal",
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Withdrawal Initiated!",
          description: "You’ll get an email when it’s completed.",
        });
        closeWithdrawModal();
        setTimeout(() => {
          handleRefreshBalance();
          fetchTransactions();
        }, 2000);
      } else {
        throw new Error(data.error || "Withdrawal failed");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: err.message,
      });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const closeWithdrawModal = () => {
    setShowWithdrawModal(false);
    setWithdrawStep(1);
    setOtp("");
    setOtpSent(false);
    setWithdrawForm({
      amount: "",
      destinationAccount: "",
      destinationBankCode: "",
      destinationBankName: "",
      narration: "",
    });
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    await Promise.all([refresh(), fetchTransactions()]);
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
    toast({
      title: "Refreshed",
      className: "bg-white",
      description: "Wallet updated.",
    });
    setIsRefreshing(false);
  };

  const checkVirtualAccount = async () => {
    try {
      const res = await fetch("/api/virtual-account/check");
      const data = await res.json();
      if (data.virtualAccount?.virtualAccountId) {
        setVirtualAccount({
          virtualAccountNumber: data.virtualAccount.virtualAccountId,
          bankName: data.virtualAccount.bankName || "FCMB",
        });
      }
    } catch (err) {
      console.error("Check account failed", err);
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
      if (res.ok && data.success) {
        await refresh();
        const updatedUserRes = await fetch("/api/users/me");
        if (updatedUserRes.ok) {
          const updatedUserData = await updatedUserRes.json();
          setUserData(updatedUserData);
          if (updatedUserData.accountNumber) {
            setVirtualAccount({
              virtualAccountNumber: updatedUserData.accountNumber,
              bankName: updatedUserData.bankName || "FCMB",
            });
          }
        }
        setCreateAccountStatus("success");
        setShowCreateAccountModal(false);
        setShowFundModal(true);
      } else {
        throw new Error(data.error || "Failed to create virtual account");
      }
    } catch (err) {
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
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        className: "bg-white",
        description: "Account number copied.",
      });
    });
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
      <Card className="bg-white">
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
    <div className="space-y-6 font-headline">
      {/* Wallet Summary */}
      <Card className="my-0 bg-white p-4 border-b-4 border-b-primary-blue">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="font-headline font-bold text-2xl">
                Wallet
              </CardTitle>
              <CardDescription>
                Manage your funds and view transaction history.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="bg-green-600 rounded-lg flex items-center justify-center px-4 text-sm text-center text-white">
                KYC Verified
              </div>
              <Button
                onClick={handleRefreshBalance}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className=" h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className=" text-center h-4 w-4" />
                )}{" "}
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
                  ? `₦${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "₦••••••"}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowFundModal(true)}
              >
                <ArrowDown className="mr-2 h-4 w-4" /> Fund
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => setShowWithdrawModal(true)}
              >
                <ArrowUp className="mr-2 h-4 w-4" /> Withdraw
              </Button>
            </div>
          </div>

          {virtualAccount?.virtualAccountNumber ? (
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="font-semibold mb-4">Your Funding Account</h3>
              <div className="space-y-2">
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
                    {virtualAccount.bankName} MFB
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-6 rounded-lg flex items-center justify-center">
              <Button onClick={() => setShowCreateAccountModal(true)} size="sm">
                Create Virtual Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History Section */}
      <Card className="p-0 py-4 md:p-4 bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/transactions")}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Limited to the first 5 transactions */}
                {transactions.slice(0, 5).map((tx, idx) => (
                  <TableRow key={tx.id || idx}>
                    <TableCell>
                      {tx.date ? new Date(tx.date).toLocaleString() : "N/A"}
                    </TableCell>
                    <TableCell>{tx.description || tx.narration}</TableCell>
                    <TableCell
                      className={
                        tx.type === "debit" || tx.amount < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      ₦
                      {Math.abs(tx.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          tx.status?.toLowerCase() === "success"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {tx.status?.toLowerCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">No transactions found</div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Modal with OTP Flow */}
      <Dialog
        open={showWithdrawModal}
        onOpenChange={(open) => !open && closeWithdrawModal()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              {withdrawStep === 1
                ? "Security Verification"
                : "Transfer money to any bank account in Nigeria."}
            </DialogDescription>
          </DialogHeader>

          {withdrawStep === 1 ? (
            <div className="py-6 space-y-6 text-center">
              <div className="flex justify-center">
                <div className="p-4 bg-primary-blue/5 rounded-full">
                  <ShieldCheck className="w-12 h-12 text-primary-blue" />
                </div>
              </div>

              {!otpSent ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground px-6">
                    To protect your funds, we need to verify your identity. A
                    verification code will be sent to{" "}
                    <strong>{user.email}</strong>.
                  </p>
                  <Button
                    className="w-full"
                    onClick={handleSendOTP}
                    disabled={otpLoading}
                  >
                    {otpLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Send Verification Code
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="text-center text-2xl tracking-[8px] font-bold h-12"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleVerifyOTP}
                    disabled={otp.length < 6 || otpLoading}
                  >
                    {otpLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Verify & Continue
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSendOTP}>
                    Resend Code
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={withdrawForm.amount}
                  onChange={(e) =>
                    setWithdrawForm({ ...withdrawForm, amount: e.target.value })
                  }
                  required
                  min="1"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  Balance: ₦{walletBalance.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank">Bank</Label>
                <SearchableSelect
                  options={banks.map((b) => ({
                    value: b.bankCode,
                    label: b.bankName,
                  }))}
                  value={withdrawForm.destinationBankCode}
                  onValueChange={(val) => {
                    const bank = banks.find((b) => b.bankCode === val);
                    if (bank)
                      setWithdrawForm({
                        ...withdrawForm,
                        destinationBankCode: bank.bankCode,
                        destinationBankName: bank.bankName,
                      });
                  }}
                  placeholder="Select bank..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account">Account Number</Label>
                <Input
                  id="account"
                  placeholder="10-digit number"
                  maxLength={10}
                  value={withdrawForm.destinationAccount}
                  onChange={(e) =>
                    setWithdrawForm({
                      ...withdrawForm,
                      destinationAccount: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeWithdrawModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={withdrawLoading}
                  className="bg-green-600"
                >
                  {withdrawLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm Withdrawal"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
