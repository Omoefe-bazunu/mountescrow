"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRightLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FeesBreakdown() {
  const [isOpen, setIsOpen] = useState(false);

  const pricingStructure = [
    {
      range: "₦0 – ₦1M",
      buyerFee: "5%",
      sellerFee: "5%",
      totalFee: "10%",
      rationale:
        "Covers operational cost of small deals. High volume tier (freelancers, rentals, trade)",
    },
    {
      range: "₦1M – ₦5M",
      buyerFee: "2.5%",
      sellerFee: "2.5%",
      totalFee: "5%",
      rationale: "For micro-SMEs, auto dealers, service providers",
    },
    {
      range: "₦5M – ₦50M",
      buyerFee: "2%",
      sellerFee: "2%",
      totalFee: "4%",
      rationale: "Growing SMEs, professionals, car lots, building materials",
    },
    {
      range: "₦50M – ₦200M",
      buyerFee: "1.5%",
      sellerFee: "1.5%",
      totalFee: "3%",
      rationale: "Construction, mid-scale real estate, procurement",
    },
    {
      range: "₦200M – ₦1B",
      buyerFee: "1%",
      sellerFee: "1%",
      totalFee: "2%",
      rationale: "Government contractors, large estate projects",
    },
    {
      range: "₦1B+",
      buyerFee: "0.5%",
      sellerFee: "0.5%",
      totalFee: "1% (capped)",
      rationale: "Ultra-high-net-worth deals; reinforces trust & exclusivity",
    },
  ];

  return (
    <motion.div
      className="w-full bg-primary-blue text-white"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="container max-w-screen-xl mx-auto px-4 md:px-8 py-16 font-headline">
        <motion.div
          className="mt-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.2 } },
          }}
        >
          <motion.h2
            className="font-headline font-semibold text-3xl md:text-4xl mb-2"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            Fee Breakdown
          </motion.h2>
          <motion.p
            className="text-lg text-white max-w-2xl mb-8"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            Every transaction on our platform is subject to a dynamic fee based
            on the total deal value. This fee covers processing, escrow, and
            disbursement services. It starts at <strong>10%</strong> and
            decreases to as low as <strong>1%</strong>.
          </motion.p>

          <div className="relative z-10">
            {/* Custom Toggle Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-between w-full max-w-[280px] bg-white text-primary-blue px-4 py-3 rounded-md font-semibold shadow-lg transition-all hover:bg-slate-100"
            >
              <span>
                {isOpen ? "Hide Pricing Structure" : "View Pricing Structure"}
              </span>
              <ChevronDown
                className={`ml-2 h-5 w-5 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-4"
                >
                  {/* Mobile Scroll Indicator */}
                  <div className="lg:hidden flex items-center gap-2 text-sm text-white/80 mb-3 animate-pulse bg-white/10 w-fit px-3 py-1 rounded-full">
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>Swipe to see more</span>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto w-full touch-pan-x">
                      <Table className="min-w-[800px] w-full border-collapse">
                        <TableHeader className="bg-slate-100">
                          <TableRow className="border-b border-slate-200">
                            <TableHead className="p-4 text-primary-blue border-r border-slate-200 font-bold whitespace-nowrap">
                              Deal Value (₦)
                            </TableHead>
                            <TableHead className="p-4 text-primary-blue border-r border-slate-200 font-bold whitespace-nowrap">
                              Buyer Fee
                            </TableHead>
                            <TableHead className="p-4 text-primary-blue border-r border-slate-200 font-bold whitespace-nowrap">
                              Seller Fee
                            </TableHead>
                            <TableHead className="p-4 text-primary-blue border-r border-slate-200 font-bold whitespace-nowrap">
                              Total Fee
                            </TableHead>
                            <TableHead className="p-4 text-primary-blue font-bold">
                              Strategic Rationale
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pricingStructure.map((tier, index) => (
                            <TableRow
                              key={index}
                              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                              <TableCell className="p-4 border-r border-slate-100 text-slate-800 font-medium whitespace-nowrap">
                                {tier.range}
                              </TableCell>
                              <TableCell className="p-4 border-r border-slate-100 text-slate-700">
                                {tier.buyerFee}
                              </TableCell>
                              <TableCell className="p-4 border-r border-slate-100 text-slate-700">
                                {tier.sellerFee}
                              </TableCell>
                              <TableCell className="p-4 border-r border-slate-100 text-slate-900 font-bold">
                                {tier.totalFee}
                              </TableCell>
                              <TableCell className="p-4 text-slate-600 min-w-[320px] text-sm leading-relaxed">
                                {tier.rationale}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Rest of the sections */}
          <div className="mt-12">
            <motion.h3
              className="font-headline font-semibold text-3xl text-white mb-2"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Payment options for buyers
            </motion.h3>
            <motion.ul className="text-lg text-white list-disc list-inside mt-2 max-w-2xl space-y-1">
              {[
                "Bank Transfer",
                "Fee automatically added to the purchase price if applicable",
              ].map((item, i) => (
                <motion.li
                  key={i}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 },
                  }}
                >
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <div className="mt-12">
            <motion.h3
              className="font-headline font-semibold text-3xl text-white mb-2"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Disbursement options
            </motion.h3>
            <motion.p
              className="text-lg text-white max-w-2xl"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Once all terms are fulfilled and verified, Mountescrow credits the
              seller’s wallet. From there, the seller can easily request a
              withdrawal. All agreed fees are deducted transparently.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
