"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Menu, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function LandingHeader() {
  const [user, setUser] = useState(null);
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
        <Button variant="ghost" asChild className="text-lg text-primary-blue">
          <Link href="/login">Login</Link>
        </Button>
        <Button
          asChild
          className="bg-orange-500 text-lg hover:bg-highlight-blue transition-colors hover:text-white text-white"
        >
          <Link href="/signup">
            Sign Up <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </>
    );
  };

  const NavLinks = ({ isMobile }) => {
    const Wrapper = isMobile ? SheetClose : React.Fragment;
    const wrapperProps = isMobile ? { asChild: true } : {};

    const linkClass =
      "text-primary-blue text-lg hover:text-highlight-blue transition-colors font-medium";
    const mobileLinkClass =
      "block w-full text-secondary-blue hover:text-highlight-blue transition-colors font-medium ext-left p-2 rounded-md hover:bg-muted";
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
        <Wrapper {...wrapperProps}>
          <Link href="/contact-us" className={navLinkStyles}>
            Contact
          </Link>
        </Wrapper>
        <Wrapper {...wrapperProps}>
          <Link href="/policies" className={navLinkStyles}>
            Policies
          </Link>
        </Wrapper>
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
      <div className="container max-w-screen-xl mx-auto px-4 md:px-8 flex h-16 items-center justify-between">
        {/* Left - Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FWEBlogo.png?alt=media&token=7e74c386-87f2-4fc6-9f0a-d8cfbb467be7"
            alt="Mountescrow"
            width={312}
            height={44.2}
            className="object-contain w-44 md:w-[312px] h-auto"
            priority
          />
        </Link>

        {/* Center - Nav */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-6 text-sm font-medium">
          <NavLinks />
        </nav>

        {/* Right - Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
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
                <NavLinks isMobile />
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
