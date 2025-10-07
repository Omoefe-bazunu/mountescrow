"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

const styles = `
  @keyframes fadeUp {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeUp {
    animation: fadeUp 0.8s ease-out forwards;
  }

  .card-hover {
    transition: all 0.4s ease;
  }
  .card-hover:hover {
    transform: scale(1.05);
    background-color: hsl(var(--primary));
    color: white;
  }
  .card-hover:hover h3 {
    color: white;
  }
  .card-hover:hover ul li {
    color: white;
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
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  const cards = [
    {
      title: "PHYSICAL PRODUCTS",
      items: [
        "Electronics & Gadgets",
        "Mobile Phones & Accessories",
        "Home Appliances",
        "Fashion & Clothing Items",
        "Other Everyday Products",
      ],
      image:
        "https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FPHYS.png?alt=media&token=a2a12a27-9a0e-447e-84ba-692fdf4af0aa",
    },
    {
      title: "DIGITAL PRODUCTS",
      items: [
        "Web Development & Software Services",
        "Design & Creative Projects",
        "Online Courses (PDF, Video, eLearning)",
        "Templates & Licensed Digital Goods",
        "Downloadable Content & Resources",
      ],
      image:
        "https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FSER.jpeg?alt=media&token=6460acfb-9d38-4993-aec8-c58e6b26a2cc",
    },
    {
      title: "SERVICES",
      items: [
        "Freelance & Contract Work",
        "Professional Services",
        "Consulting, Advisory & Business Solutions",
        "Real Estate Transactions & Payments",
        "Vendor Bookings & Event Services",
      ],
      image:
        "https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FDIG.jpeg?alt=media&token=301e7505-b924-4537-a9c1-1f360edb9e6f",
    },
  ];

  return (
    <div
      className="bg-primary-blue "
      // style={{
      //   backgroundImage:
      //     "url('https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FwhyyoushoulduseusbgImage.jpg?alt=media&token=e7a526e4-851d-4804-b3d2-1d60b2144d58')",
      //   backgroundSize: "cover",
      //   backgroundRepeat: "no-repeat",
      //   backgroundPosition: "center",
      // }}
      data-ai-hint="market products"
    >
      <style>{styles}</style>

      <section
        ref={sectionRef}
        className="py-20 text-center max-w-screen-xl mx-auto px-4 md:px-8"
      >
        <h2
          className={`text-white font-semibold font-headline text-3xl md:text-4xl mb-6 ${
            sectionInView ? "animate-fadeUp" : "opacity-0"
          }`}
        >
          Goods, Services, and More. All Safely on Mountescrow
        </h2>

        <p
          className={`text-white max-w-3xl mx-auto mb-12 font-body ${
            sectionInView ? "animate-fadeUp" : "opacity-0"
          }`}
          style={{ animationDelay: "0.2s" }}
        >
          Whether it’s products, services, or digital assets, MountEscrow
          provides a safe, trusted space for every transaction.
        </p>

        <div className="grid gap-8 md:grid-cols-3 text-left">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`bg-card rounded-lg shadow-lg bg-white hover:bg-highlight-blue overflow-hidden card-hover opacity-0 ${
                sectionInView ? "animate-fadeUp" : ""
              }`}
              style={{ animationDelay: `${0.3 + index * 0.2}s` }}
            >
              <div className="w-full aspect-[4/3] relative">
                <Image
                  src={card.image}
                  alt={card.title}
                  width={800}
                  height={600}
                  className="object-cover rounded-t-lg w-full h-full"
                />
              </div>
              <div className="p-6">
                <h3 className="text-primary-blue font-semibold font-headline text-2xl mb-3">
                  {card.title}
                </h3>
                <ul className="list-disc list-inside text-secondary-blue text-sm space-y-1 font-body">
                  {card.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
