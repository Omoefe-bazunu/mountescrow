import AdminDashboard from "@/components/AdminDashboard";
import { Footer } from "@/components/footer";
import { LandingHeader } from "@/components/landing-header";

export default function AdminDashboardPage() {
  return (
    <div>
      <LandingHeader />
      <AdminDashboard />
      <Footer />
    </div>
  );
}
