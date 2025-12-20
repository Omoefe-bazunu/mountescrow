"use client";

import Link from "next/link";
import Image from "next/image";
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
  PersonStanding,
  PersonStandingIcon,
  CircleUser,
  BellIcon,
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { LandingHeader } from "@/components/landing-header";
import { Footer } from "@/components/footer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/notification-bell";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/proposals", icon: FileText, label: "Proposals" },
  { href: "/deals", icon: Package, label: "Deals" },
  { href: "/transactions", icon: ArrowRightLeft, label: "Transactions" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/disputes", icon: Shield, label: "Disputes" },
  { href: "/kyc", icon: Verified, label: "KYC" },
  { href: "/notifications", icon: BellIcon, label: "Notifications" },
  { href: "/profile", icon: CircleUser, label: "Profile" },
];

export default function DashboardLayout({ children }) {
  const { user, loading, isEmailVerified, logout, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [Loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        setIsVerified(data.isVerified);
      } else {
        router.push("/login");
      }
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
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

  if (!user) return null;

  const EmailVerificationBanner = () => {
    if (!user || isEmailVerified) return null;

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
          Please check your inbox and look for the verification code.
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
      <div className="grid font-headline min-h-screen w-full max-w-[100vw] overflow-x-hidden md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-background">
        <div className="hidden border-r bg-secondary-blue text-white md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-white hover:bg-highlight-blue transition-all",
                      pathname === item.href && "bg-accent-blue text-white"
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
                  <Link
                    href="/contact-us"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <Button
                      size="sm"
                      className="w-full hover:bg-highlight-blue text-white"
                    >
                      Contact Support
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex font-headline flex-col w-full">
          <header className="flex font-headline h-16 bg-white items-center gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-10">
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
              <SheetContent
                side="left"
                className="flex flex-col bg-primary-blue text-white w-[250px] p-4"
              >
                {/* ✅ Accessibility fix */}
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                </VisuallyHidden>

                <nav className="grid gap-2 text-lg font-medium">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <Image
                      src="https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FWEBlogoFooter.png?alt=media&token=bd662b35-e0a2-4f3c-8835-6fd32ef06a57"
                      alt="Mountescrow Logo"
                      width={312}
                      height={44.2}
                      className="object-contain w-44 md:w-[312px] h-auto"
                    />
                  </Link>
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "flex font-headline items-center gap-3 rounded-lg px-3 py-2 text-white transition-all hover:bg-highlight-blue",
                        pathname === item.href && "bg-muted text-white"
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
                        Contact our support team for any questions or issues.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link
                        href="/contact-us"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        <Button
                          size="sm"
                          className="w-full hover:bg-highlight-blue text-white bg-accent-blue"
                        >
                          Contact Support
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </SheetContent>
            </Sheet>

            <div className="w-full flex-1">
              <h3 className="font-semibold text-primary-blue">DASHBOARD</h3>
            </div>

            {/* Notification Bell */}
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-primary-blue hover:bg-highlight-blue text-white"
                >
                  <Avatar className="h-8 w-8 flex items-center justify-center text-white font-bold">
                    <CircleUser size={20} />
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-headline">
                <DropdownMenuLabel className="font-light">
                  {user?.displayName || "My Account"}
                </DropdownMenuLabel>
                <Separator />
                <DropdownMenuLabel className="font-light">
                  {user?.email || "Email"}
                </DropdownMenuLabel>
                <Separator />
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
            <div className="flex-1 p-3 lg:p-4 space-y-3 w-full max-w-[100vw] overflow-x-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
