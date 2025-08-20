import { LandingHeader } from "@/components/landing-header";
import { Footer } from "@/components/footer";

export default function AuthLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <LandingHeader />
      <div className="w-full max-w-md">{children}</div>
      <Footer />
    </div>
  );
}
