"use client";

import { LandingHeader } from "@/components/landing-header";
import { Footer } from "@/components/footer";

export default function StaticLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
