"use client";

import { useEffect, useState } from "react";

export default function HeroSection() {
  const youtubeVideoId = "DaRXece2ItE";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-image min-h-screen relative overflow-hidden">
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
          background-image: url("https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2Fhbg.jpg?alt=media&token=31f43e7f-0a35-4478-a792-dde159a972d4");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
      `}</style>

      {/* Animated background dots/particles effect */}
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
        className={`relative py-20 flex flex-col items-center justify-center gap-12 max-w-7xl mx-auto px-4 md:px-8 transition-all duration-1000 ${
          visible ? "animate-on-render" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Limited time offer badge */}
        <div className="flex items-center gap-3 bg-primary-blue text-white px-4 py-1 rounded-md text-sm ">
          <span className="bg-white text-primary-blue flex-grow py-1 rounded text-xs px-6">
            High-stakes transactions?
          </span>
          <span className="">100% Secured</span>
        </div>

        {/* Main headline */}
        <div className="max-w-4xl flex flex-col items-center text-center">
          <h1 className="text-primary-blue font-bold text-3xl md:text-5xl lg:text-6xl mb-6 leading-tight">
            Escrow Made Effortless. Close Deals,
            <span className="text-orange-500"> Not Concerns.</span>
          </h1>

          {/* CTA Button with avatars */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <button className="bg-orange-500 hover:bg-highlight-blue text-white px-4 py-2 text-lg rounded-md transition-transform duration-300 hover:scale-105 shadow-lg flex items-center gap-2">
              Get Started
              <span className="bg-white text-orange-500 rounded px-2 hover:text-highlight-blue flex items-center justify-center">
                →
              </span>
            </button>

            {/* Social proof avatars */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <img
                  src="https://placehold.co/40x40/010e5a/ffffff?text=1"
                  alt="User 1"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="https://placehold.co/40x40/00042f/ffffff?text=2"
                  alt="User 2"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="https://placehold.co/40x40/0066ff/ffffff?text=3"
                  alt="User 3"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="https://placehold.co/40x40/071495/ffffff?text=4"
                  alt="User 4"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
              </div>
              <div className="text-left">
                <p
                  className="text-sm font-handwriting"
                  style={{ fontFamily: "cursive" }}
                >
                  30+ PROFESSIONALS ARE
                  <br />
                  ALREADY SIGNED UP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Video/Image placeholder */}
        <div className="w-full max-w-4xl mt-8">
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-8 border-primary-blue">
            {/* YouTube Embed */}
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeVideoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
}
