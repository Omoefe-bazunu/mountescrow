"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  Bell,
  Home,
  Package,
  FileText,
  Shield,
  Settings,
  Wallet,
  LogOut,
  ArrowRightLeft,
  MailWarning,
  Verified,
  Menu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { LandingHeader } from "@/components/landing-header";
import { Footer } from "@/components/footer";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/proposals", icon: FileText, label: "Proposals" },
  { href: "/deals", icon: Package, label: "Deals" },
  { href: "/transactions", icon: ArrowRightLeft, label: "Transactions" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/disputes", icon: Shield, label: "Disputes" },
  { href: "/kyc", icon: Verified, label: "KYC" },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const usersRef = collection(db, "users");
          const q = query(
            usersRef,
            where("email", "==", currentUser.email?.toLowerCase())
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            setIsVerified(userDoc.data().isVerified || false);
          } else {
            setIsVerified(false);
            toast({
              variant: "destructive",
              title: "User not found",
              description: "No account found with this email.",
            });
            await signOut(auth);
            router.push("/login");
          }
        } catch (error) {
          console.error("Error fetching verification status:", error);
          setIsVerified(false);
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 ml-4">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  const EmailVerificationBanner = () => {
    if (!user || isVerified) return null;

    const handleResend = async () => {
      if (user) {
        router.push("/verify-account");
      }
    };

    return (
      <Alert variant="destructive" className="mx-4 my-2 rounded-lg">
        <MailWarning className="h-4 w-4" />
        <AlertTitle>Verify Your Email</AlertTitle>
        <AlertDescription>
          Please check your inbox and for the verification code.
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto ml-2 text-primary underline"
            onClick={handleResend}
          >
            Go to Verification page
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <>
      <LandingHeader />
      <div className="grid min-h-screen w-full max-w-[100vw] overflow-x-hidden md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-background">
        <div className="hidden border-r bg-card md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      pathname === item.href && "bg-muted text-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-auto p-4">
              <Card>
                <CardHeader className="p-2 pt-0 md:p-4">
                  <CardTitle className="font-headline text-xl">
                    Need Help?
                  </CardTitle>
                  <CardDescription>
                    Contact our support team for any questions or issues.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                  <Link href="/contact-us">
                    <Button size="sm" className="w-full">
                      Contact Support
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full">
          <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-10">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col w-[250px] p-4">
                <nav className="grid gap-2 text-lg font-medium">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <span>Mountescrow</span>
                  </Link>
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname === item.href && "bg-muted text-primary"
                      )}
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Need Help?</CardTitle>
                      <CardDescription>
                        Contact our support team for assistance.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link
                        href="/contact-us"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        <Button size="sm" className="w-full">
                          Contact Support
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </SheetContent>
            </Sheet>

            <div className="w-full flex-1" />
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || ""} alt="User avatar" />
                    <AvatarFallback>
                      {getInitials(user?.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.displayName || "My Account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex flex-1 flex-col bg-muted/40 w-full max-w-[100vw] overflow-x-hidden">
            <EmailVerificationBanner />
            <div className="flex-1 p-4 lg:p-6 space-y-4 w-full max-w-[100vw] overflow-x-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
