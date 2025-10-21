"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";

const styles = `
  @keyframes heartbeat {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    0% {
      opacity: 0;
      transform: translateY(40px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-heartbeat {
    animation: heartbeat 2s ease-in-out infinite;
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.8s ease-out forwards;
  }

  .animate-slideUp {
    animation: slideUp 0.7s ease-out forwards;
  }
`;

export default function ConfidenceSection() {
  const [mounted, setMounted] = useState(false);
  const [cardsInView, setCardsInView] = useState(false);
  const cardsRef = useRef(null);

  // Trigger heading/paragraph animation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Observe cards for scroll-in animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCardsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );
    if (cardsRef.current) observer.observe(cardsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="bg-white bg-cover bg-no-repeat bg-center"
      // style={{
      //   backgroundImage:
      //     "url('https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2Fwwhybg.jpg?alt=media&token=d6a2afc6-5d1b-4df1-ae0a-6c824b4ba714')",
      // }}
    >
      <style>{styles}</style>
      <section className="py-16 flex flex-col items-center text-center relative max-w-screen-xl mx-auto px-4 md:px-8">
        {/* Heading */}
        <h2
          className={`text-primary-blue font-semibold font-headline text-3xl md:text-4xl mb-6 ${
            mounted ? "animate-fadeInUp" : "opacity-0"
          }`}
        >
          SEAL EVERY DEAL WITH TOTAL CONFIDENCE
        </h2>

        {/* Paragraph */}
        <p
          className={`text-primary-blue max-w-3xl mx-auto mb-6 font-body ${
            mounted ? "animate-fadeInUp" : "opacity-0"
          }`}
          style={{ animationDelay: "0.2s" }}
        >
          Whether you are buying, hiring, renting, or exchanging value in any
          form, Mountescrow guarantees trust through impartial protection. Every
          step is transparently monitored, ensuring all parties feel secure and
          achieve complete satisfaction.
        </p>

        {/* Button */}
        <Button
          size="lg"
          asChild
          className={`bg-orange-500 hover:bg-highlight-blue text-white transition-transform duration-300 hover:scale-105 hover:shadow-lg ${
            mounted ? "animate-fadeInUp" : "opacity-0"
          }`}
          style={{ animationDelay: "0.4s" }}
        >
          <a href="/signup">Get Started</a>
        </Button>

        {/* Cards */}
        <div
          ref={cardsRef}
          className="grid gap-8 md:grid-cols-3 text-left mt-6 mb-[60px] md:mb-[100px]"
        >
          {[
            {
              title: "Shop securely, even with new sellers.",
              text: "Receive exactly what you pay for, while staying protected from fraud and false promises.",
            },
            {
              title: "Not satisfied with a delivery?",
              text: "Get compensated promptly, with disputes handled efficiently to protect your confidence.",
            },
            {
              title: "Boost buyer confidence",
              text: "Close deals more efficiently.",
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className={`bg-card bg-primary-blue text-white p-6 rounded-md shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-md ${
                cardsInView ? "animate-slideUp" : "opacity-0"
              }`}
              style={{ animationDelay: `${0.3 + idx * 0.2}s` }}
            >
              <p className="text-primary font-semibold mb-2">{card.title}</p>
              <p className="text-muted-foreground font-body">{card.text}</p>
            </div>
          ))}
        </div>

        {/* Circular image (unchanged) */}
        <div className="w-fit h-fit mx-auto mb-8 absolute -bottom-[230px] md:-bottom-[200px] transform -translate-x-1/2 animate-heartbeat">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2Fconfid%20(1).png?alt=media&token=bc947be7-240f-4c1b-9254-1799848a907e"
            alt="A person joyfully looking at a laptop, symbolizing a successful payment."
            width={300}
            height={300}
            className="rounded-full object-cover border-8 border-white shadow-lg"
          />
        </div>
      </section>
    </div>
  );
}
