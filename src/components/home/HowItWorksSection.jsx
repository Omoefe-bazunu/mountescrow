"use client";

import { useEffect, useState, useRef } from "react";
import {
  Handshake,
  ShieldCheck,
  Truck,
  ThumbsUp,
  HandCoins,
} from "lucide-react";

// Keyframe animations
const styles = `
  @keyframes slideInUp {
    0% {
      opacity: 0;
      transform: translateY(50px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slideInUp {
    animation: slideInUp 0.6s ease-out forwards;
  }

  /* Smooth sequential infinite pop */
  @keyframes smoothPop {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.15);
    }
  }

  .icon-seq-pop {
    animation: smoothPop 2s ease-in-out infinite;
  }
`;

export default function HowItWorksSection() {
  const [sectionInView, setSectionInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  const steps = [
    {
      icon: Handshake,
      main: "Terms are Set",
      text: "Buyer and Seller agree on transaction details and conditions.",
    },
    {
      icon: ShieldCheck,
      main: "Payment is Secured",
      text: "Buyer deposits payment into Mountescrow’s secure account.",
    },
    {
      icon: Truck,
      main: "Order is Delivered",
      text: "Seller fulfills and delivers the product or service as agreed.",
    },
    {
      icon: ThumbsUp,
      main: "Order is Approved",
      text: "Buyer reviews and confirms satisfaction with the order.",
    },
    {
      icon: HandCoins,
      main: "Payment is Released",
      text: "Mountescrow releases funds to the seller—deal complete!",
    },
  ];

  return (
    <div
      className="bg-gray-100"
      style={{
        backgroundImage:
          "url('https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FhowMountescrowWorksImage.jpg?alt=media&token=cedd54b5-52ea-462e-9df5-363b79a82276')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <style>{styles}</style>
      <section
        id="how-it-works"
        ref={sectionRef}
        className="pb-20 pt-28 md:pt-20 text-center max-w-screen-xl mx-auto px-4 md:px-8"
      >
        <div className="max-w-5xl mx-auto mt-[120px] md:mt-[140px]">
          <h2
            className={`text-primary-blue font-semibold font-headline text-3xl md:text-4xl mb-4 ${
              sectionInView ? "animate-slideInUp" : "opacity-0"
            }`}
          >
            HOW MOUNTESCROW WORKS
          </h2>

          <p
            className={`text-muted-foreground max-w-2xl mx-auto mb-10 font-body ${
              sectionInView ? "animate-slideInUp" : "opacity-0"
            }`}
            style={{ animationDelay: "0.2s" }}
          >
            Each transaction follows a secure, transparent, and automated flow —
            protecting both buyer and seller every step of the way.
          </p>

          {/* Steps */}
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 text-center text-primary">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-start p-8 md:p-4 rounded-xl bg-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-2 ${
                  sectionInView ? "animate-slideInUp" : "opacity-0"
                }`}
                style={{ animationDelay: `${0.3 + i * 0.2}s` }}
              >
                <div
                  className={`bg-primary-blue h-20 w-20 rounded-full flex items-center justify-center mb-4 relative border-4 border-white shadow-md ${
                    sectionInView ? "icon-seq-pop" : ""
                  }`}
                >
                  <div className="font-bold text-2xl absolute -top-3 -left-1 text-primary-blue rounded-full bg-white w-10 h-10 flex items-center justify-center">
                    {i + 1}
                  </div>
                  <step.icon size={40} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold font-headline text-primary-blue mb-1">
                  {step.main}
                </h3>
                <p className="text-gray-700 text-sm font-body leading-relaxed">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
