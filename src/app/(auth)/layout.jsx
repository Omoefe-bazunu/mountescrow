import { LandingHeader } from "@/components/landing-header";
import { Footer } from "@/components/footer";

export default function AuthLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader />
      <div className="w-full max-w-md">{children}</div>
      <Footer />
    </div>
  );
}
