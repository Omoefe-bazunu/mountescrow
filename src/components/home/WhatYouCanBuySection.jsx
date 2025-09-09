"use client";

import { useEffect, useState, useRef } from "react";

// Updated CSS with adjusted flip animation
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
  
  @keyframes slideInFromLeft {
    0% {
      opacity: 0;
      transform: translateX(-50px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideInFromRight {
    0% {
      opacity: 0;
      transform: translateX(50px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes flipHalf {
    0%, 100% {
      transform: perspective(1000px) rotateY(0deg);
    }
    50% {
      transform: perspective(1000px) rotateY(15deg); /* Adjusted to 45deg for half flip */
    }
  }
  
  .animate-slideInUp {
    animation: slideInUp 0.6s ease-out forwards;
  }
  
  .animate-slideInFromLeft {
    animation: slideInFromLeft 0.8s ease-out forwards, flipHalf 3s ease-in-out 0.8s infinite;
  }
  
  .animate-slideInFromRight {
    animation: slideInFromRight 0.8s ease-out forwards, flipHalf 3s ease-in-out 0.8s infinite;
  }
`;

export default function WhatYouCanBuySection() {
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
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.2,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <div
      className="bg-background"
      style={{
        backgroundImage:
          "url('https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FwhyyoushoulduseusbgImage.jpg?alt=media&token=e7a526e4-851d-4804-b3d2-1d60b2144d58')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      data-ai-hint="market products"
    >
      <style>{styles}</style>
      <section
        ref={sectionRef}
        className="py-20 text-center max-w-screen-xl mx-auto px-4 md:px-8"
      >
        <h2
          className={`text-primary-foreground font-semibold font-headline text-3xl md:text-4xl mb-6 ${sectionInView ? "animate-slideInUp" : "opacity-0"}`}
        >
          Goods, Services, and More — All Safely on Mountescrow
        </h2>
        <p
          className={`text-primary-foreground max-w-3xl mx-auto mb-12 font-body ${sectionInView ? "animate-slideInUp" : "opacity-0"}`}
          style={{ animationDelay: "0.2s" }}
        >
          Whether it’s products, services, or digital assets, MountEscrow
          provides a safe, trusted space for every transaction.
        </p>

        <div className="grid gap-6 md:grid-cols-3 text-left">
          {/* Card with slide-in from left and adjusted flip animation */}
          <div
            className={`bg-card p-6 rounded shadow transition-all duration-300 hover:scale-105 hover:shadow-lg ${sectionInView ? "animate-slideInFromLeft" : "opacity-0"}`}
            style={{ animationDelay: "0.4s" }}
          >
            <h3 className="text-primary font-semibold font-headline text-2xl mb-2">
              PHYSICAL PRODUCTS
            </h3>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 font-body">
              <li>Electronics & Gadgets</li>
              <li>Mobile Phones & Accessories</li>
              <li>Home Appliances</li>
              <li>Fashion & Clothing Items</li>
              <li>Other Everyday Products</li>
            </ul>
          </div>

          {/* Card with slide-in from right and adjusted flip animation */}
          <div
            className={`bg-card p-6 rounded shadow transition-all duration-300 hover:scale-105 hover:shadow-lg ${sectionInView ? "animate-slideInFromRight" : "opacity-0"}`}
            style={{ animationDelay: "0.6s" }}
          >
            <h3 className="text-primary font-semibold font-headline text-2xl mb-2">
              DIGITAL PRODUCTS
            </h3>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 font-body">
              <li>Web Development & Software Services</li>
              <li>Design & Creative Projects</li>
              <li>Online Courses (PDF, Video, eLearning)</li>
              <li>emplates & Licensed Digital Goods</li>
              <li>Downloadable Content & Resources</li>
            </ul>
          </div>

          {/* Card with slide-in from right and adjusted flip animation */}
          <div
            className={`bg-card p-6 rounded shadow transition-all duration-300 hover:scale-105 hover:shadow-lg ${sectionInView ? "animate-slideInFromRight" : "opacity-0"}`}
            style={{ animationDelay: "0.8s" }}
          >
            <h3 className="text-primary font-semibold font-headline text-2xl mb-2">
              SERVICES
            </h3>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 font-body">
              <li>Freelance & Contract Work</li>
              <li>Professional Services</li>
              <li>Consulting, Advisory & Business Solutions</li>
              <li>Real Estate Transactions & Payments</li>
              <li>Vendor Bookings & Event Services</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
