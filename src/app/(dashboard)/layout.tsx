
"use client";

import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
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
  MailWarning
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
import { cn } from "@/lib/utils";
import { onAuthStateChanged, User, signOut, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";


const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/proposals", icon: FileText, label: "Proposals" },
    { href: "/deals", icon: Package, label: "Deals" },
    { href: "/transactions", icon: ArrowRightLeft, label: "Transactions" },
    { href: "/wallet", icon: Wallet, label: "Wallet" },
    { href: "/disputes", icon: Shield, label: "Disputes" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
    if (!user || user.emailVerified) return null;

    const handleResend = async () => {
        if (user) {
            await sendEmailVerification(user);
            toast({
                title: 'Verification Email Sent',
                description: 'Please check your inbox for a new verification link.',
            });
        }
    }

    return (
        <Alert variant="destructive" className="m-4 rounded-lg">
            <MailWarning className="h-4 w-4" />
            <AlertTitle>Verify Your Email</AlertTitle>
            <AlertDescription>
                Please check your inbox and click the verification link to unlock all features.
                <Button variant="link" size="sm" className="p-0 h-auto ml-2 text-destructive-foreground" onClick={handleResend}>
                    Resend Email
                </Button>
            </AlertDescription>
        </Alert>
    );
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-background">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-4 lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
               </svg>
              <span className="font-headline text-2xl font-bold text-primary">Mountescrow</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map(item => (
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
            <Card className="my-0">
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle className="font-headline text-xl">Need Help?</CardTitle>
                <CardDescription>
                  Contact our support team for any questions or issues.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <div className="w-full flex-1">
            {/* Can add a search bar here if needed */}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || "https://placehold.co/40x40.png"} alt="User avatar" data-ai-hint="user avatar" />
                    <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.displayName || "My Account"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4"/>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer"><LogOut className="mr-2 h-4 w-4"/>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col bg-muted/40">
           <EmailVerificationBanner />
           <div className="flex-1 p-4 lg:p-6 space-y-4">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
}
