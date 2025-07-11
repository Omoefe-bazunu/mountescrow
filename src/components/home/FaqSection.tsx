"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const faqData = {
  GENERAL: [
    {
      question: "What is Mountescrow?",
      answer:
        "Mountescrow is a digital escrow solution designed to enhance trust and security in digital transactions. It offers escrow services that protect both buyers and sellers.",
    },
    {
      question: "How does Mountescrow Work?",
      answer:
        "Mountescrow holds funds securely between buyer and seller until both parties agree to release them. It’s a transparent and safe way to transact.",
    },
    {
      question: "How is my money with Mountescrow secured?",
      answer:
        "Funds are held in a secure escrow account and only released once both parties agree. We work with licensed financial partners and secure systems to safeguard all transactions.",
    },
  ],
  PRICING: [
    {
      question: "Is Mountescrow free?",
      answer:
        "Creating an account is free. A small escrow fee is applied only when you use the platform for transactions. You’ll see this clearly before committing to payment.",
    },
  ],
  PRIVACY: [
    {
      question: "Do you sell user data?",
      answer:
        "No. Mountescrow does not sell or share user data with third parties. We respect your privacy and uphold data protection regulations.",
    },
  ],
  "DISPUTE RESOLUTION": [
    {
      question: "What happens if there’s a dispute?",
      answer:
        "If either party is unsatisfied, Mountescrow’s resolution center will intervene and process a refund or release based on evidence and agreement terms.",
    },
  ],
};

export default function FaqSection() {
  const [activeTab, setActiveTab] = useState("GENERAL");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-background py-20 px-4 md:px-20">
      <h2 className="text-primary font-headline text-3xl md:text-4xl text-center mb-8">
        FREQUENTLY ASKED QUESTIONS
      </h2>

      <div className="flex justify-center gap-4 flex-wrap mb-12">
        {Object.keys(faqData).map((category) => (
          <Button
            key={category}
            variant={activeTab === category ? "default" : "outline"}
            onClick={() => {
              setActiveTab(category);
              setOpenIndex(null);
            }}
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto space-y-4 font-body">
        {(faqData as any)[activeTab].map((item: {question: string, answer: string}, idx: number) => (
          <div
            key={idx}
            className="bg-card rounded shadow overflow-hidden border border-border"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full px-6 py-4 flex justify-between items-center text-left"
            >
              <span className="font-medium text-primary">
                {item.question}
              </span>
              <span className="text-2xl text-primary">
                {openIndex === idx ? "−" : "+"}
              </span>
            </button>
            {openIndex === idx && (
              <div className="px-6 pb-4 text-muted-foreground text-sm">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
