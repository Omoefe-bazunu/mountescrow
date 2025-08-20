import { LandingHeader } from '@/components/landing-header';
import { Footer } from '@/components/footer';
import HeroSection from '@/components/home/HeroSection';
import ConfidenceSection from '@/components/home/ConfidenceSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import WhatYouCanBuySection from '@/components/home/WhatYouCanBuySection';
import UseCasesSection from '@/components/home/UseCasesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import FaqSection from '@/components/home/FaqSection';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader />
      <main>
        <HeroSection />
        <ConfidenceSection />
        <HowItWorksSection />
        <WhatYouCanBuySection />
        <UseCasesSection />
        <TestimonialsSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
