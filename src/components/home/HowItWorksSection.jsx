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
    { icon: Handshake, text: "Buyer and Seller agree on terms" },
    { icon: ShieldCheck, text: "Buyer funds escrow via Mountescrow" },
    { icon: Truck, text: "Seller delivers order to buyer" },
    { icon: ThumbsUp, text: "Buyer approves order" },
    { icon: HandCoins, text: "Mountescrow releases payment to seller" },
  ];

  return (
    <div
      className="bg-background"
      style={{
        backgroundImage:
          "url('https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FhowMountescrowWorksImage.jpg?alt=media&token=c4018604-278f-46e8-ada2-eb9ab864a8e2')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <style>{styles}</style>
      <section
        id="how-it-works"
        ref={sectionRef}
        className="py-20 text-center max-w-screen-xl mx-auto px-4 md:px-8"
      >
        <div className="max-w-5xl mx-auto mt-[120px] md:mt-[140px]">
          <h2
            className={`text-primary font-semibold font-headline text-3xl md:text-4xl mb-4 ${
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
            Buyers and sellers can be rest assured that their money and goods
            are fully secured for every exchange. We provide more than escrow,
            offering reliability and safety in every transaction.
          </p>

          <div className="grid gap-6 md:grid-cols-5 text-center text-sm md:text-base text-primary">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex flex-col items-center ${
                  sectionInView ? "animate-slideInUp" : "opacity-0"
                }`}
                style={{ animationDelay: `${0.4 + i * 0.2}s` }}
              >
                <div
                  className={`bg-primary h-24 w-24 rounded-full flex items-center justify-center mb-2 relative border-4 border-card ${
                    sectionInView ? "icon-seq-pop" : ""
                  }`}
                  style={{ animationDelay: `${i * 1.2}s` }}
                >
                  <div className="font-bold text-2xl absolute -top-3 -left-1 text-primary rounded-full bg-card w-10 h-10 flex items-center justify-center">
                    {i + 1}
                  </div>
                  <step.icon size={50} className="text-primary-foreground" />
                </div>
                <p className="font-body">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
