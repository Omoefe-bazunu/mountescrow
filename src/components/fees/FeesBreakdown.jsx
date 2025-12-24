"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FeesBreakdown() {
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
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="container max-w-screen-xl mx-auto px-4 md:px-8 py-16 font-headline">
        {/* Header Section */}
        <motion.div
          className="mb-10 space-y-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.2 } },
          }}
        >
          <motion.h2
            className="font-headline font-semibold text-3xl md:text-4xl"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            Fee Breakdown
          </motion.h2>
          <motion.p
            className="text-lg text-white/90 max-w-3xl leading-relaxed"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            Every transaction on our platform is subject to a dynamic fee based
            on the total deal value. This fee covers processing, escrow, and
            disbursement services. It starts at <strong>10%</strong> for smaller
            deals and decreases to as low as <strong>1%</strong> for
            ultra-high-value transactions.
          </motion.p>
        </motion.div>

        {/* Pricing Table Card */}
        <motion.div
          className="w-full bg-white rounded-xl overflow-hidden shadow-xl text-slate-800 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-primary-blue pl-4 font-bold text-base w-[180px]">
                    Deal Value (₦)
                  </TableHead>
                  <TableHead className="text-primary-blue font-bold text-base w-[100px]">
                    Buyer Fee
                  </TableHead>
                  <TableHead className="text-primary-blue font-bold text-base w-[100px]">
                    Seller Fee
                  </TableHead>
                  <TableHead className="text-primary-blue font-bold text-base w-[120px]">
                    Total Fee
                  </TableHead>
                  <TableHead className="text-primary-blue font-bold text-base">
                    Strategic Rationale
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingStructure.map((tier, index) => (
                  <TableRow
                    key={index}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="font-medium pl-4 text-primary-blue">
                      {tier.range}
                    </TableCell>
                    <TableCell>{tier.buyerFee}</TableCell>
                    <TableCell>{tier.sellerFee}</TableCell>
                    <TableCell className="font-semibold">
                      {tier.totalFee}
                    </TableCell>
                    <TableCell className="text-slate-600 leading-snug">
                      {tier.rationale}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* Additional Info Section */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
          {/* Buyer Options */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-headline font-semibold text-2xl text-white mb-4">
              Payment options for buyers
            </h3>
            <ul className="text-lg text-white/90 list-disc list-outside pl-5 space-y-3 leading-relaxed">
              <li>Bank Transfer</li>
              <li>
                If agreed to pay all or some of the fee, it is automatically
                added to the purchase price of the item you are buying.
              </li>
            </ul>
          </motion.div>

          {/* Seller Disbursement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="font-headline font-semibold text-2xl text-white mb-4">
              Disbursement for sellers
            </h3>
            <p className="text-lg text-white/90 leading-relaxed">
              When a transaction begins, sellers and brokers can choose how
              they’d like to receive their funds. Once all terms are fulfilled
              and verified, Mountescrow credits the seller’s wallet. From there,
              the seller can easily request a withdrawal.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
