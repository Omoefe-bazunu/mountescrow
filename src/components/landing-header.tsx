"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Menu, ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const AuthButtons = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      );
    }
    if (user) {
      return (
        <>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button onClick={handleLogout} variant="destructive">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </>
      );
    }
    return (
      <>
        <Button variant="ghost" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button
          asChild
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Link href="/signup">
            Sign Up <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </>
    );
  };

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => {
    const Wrapper = isMobile ? SheetClose : React.Fragment;
    const wrapperProps: { asChild?: boolean } = isMobile
      ? { asChild: true }
      : {};

    const linkClass =
      "text-foreground/60 transition-colors hover:text-foreground/80";
    const mobileLinkClass =
      "block w-full text-left p-2 rounded-md hover:bg-muted";

    const navLinkStyles = isMobile ? mobileLinkClass : linkClass;

    return (
      <>
        <Wrapper {...wrapperProps}>
          <Link href="/why-mountescrow" className={navLinkStyles}>
            Why Mountescrow?
          </Link>
        </Wrapper>
        <Wrapper {...wrapperProps}>
          <Link href="/products" className={navLinkStyles}>
            Products
          </Link>
        </Wrapper>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-1 outline-none",
              navLinkStyles
            )}
          >
            Support <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link href="/contact-us">Contact Us</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/policies">Policies</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Wrapper {...wrapperProps}>
          <Link href="/fee-calculator" className={navLinkStyles}>
            Fees
          </Link>
        </Wrapper>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container max-w-screen-xl mx-auto px-4 md:px-8 flex h-16 justify-between items-center">
        <Link href="/" className="mr-auto flex items-center gap-2">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FWEBlogo.png?alt=media&token=e65a5ac9-4ca3-4140-bf52-135610209802"
            alt="Mountescrow"
            width={312}
            height={44.2}
            className="object-contain w-44 md:w-[312px] h-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex justify-between items-center gap-6 text-sm font-medium">
          <NavLinks />
        </nav>

        <div className="hidden md:flex ml-4 items-center gap-2">
          <AuthButtons />
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden ml-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks isMobile={true} />
                <div className="mt-4 border-t pt-4 flex flex-col gap-2">
                  <AuthButtons />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
