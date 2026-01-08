"use client";

import { useEffect, useState } from "react";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-primary-blue bg-image h-fit relative overflow-hidden">
      <style jsx>{`
        @keyframes fadeSlideUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-on-render {
          animation: fadeSlideUp 1s ease-out forwards;
        }

        .bg-image {
          background-image: url("https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2Fwwhybg.jpg?alt=media&token=d6a2afc6-5d1b-4df1-ae0a-6c824b4ba714");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
      `}</style>

      {/* Animated background dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-2 h-2 bg-orange-400 rounded-full animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute bottom-40 left-1/4 w-2 h-2 bg-orange-400 rounded-full animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <section
        className={`relative flex flex-col items-center justify-center gap-8 md:gap-12 max-w-7xl mx-auto px-4 md:px-8 transition-all duration-1000
        ${visible ? "animate-on-render" : "opacity-0 translate-y-8"}
        py-44 md:py-32`}
      >
        {/* Headline */}
        <div className="max-w-4xl flex flex-col items-center text-center">
          <h1 className="text-white text-nowrap font-bold text-4xl sm:text-4xl md:text-6xl lg:text-7xl mb-8 leading-tight">
            Every Transaction
            <span className="text-orange-500">
              <br />
              Absolute Trust <br />
              <span className="text-white">Every time</span>
            </span>
          </h1>

          {/* CTA Button */}
          <div className="flex font-headline flex-col md:flex-row items-center gap-4 md:gap-6 mt-4">
            <button className="bg-orange-500 hover:bg-highlight-blue text-white px-5 py-2.5 text-lg rounded-md transition-transform duration-300 hover:scale-105 shadow-lg flex items-center gap-2">
              <a href="/dashboard">Get Started</a>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
