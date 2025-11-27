"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      data-ai-hint="abstract pattern"
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
            className="text-lg text-white max-w-2xl"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            Every transaction on our platform is subject to a dynamic fee based
            on the total deal value. This fee covers processing, escrow, and
            disbursement services. It starts at <strong>10%</strong> for smaller
            deals and decreases to as low as <strong>1%</strong> for
            ultra-high-value transactions. The fee can be paid entirely by one
            party or split between the buyer and seller at varying percentages,
            offering flexibility and fairness. Our pricing is among the most
            competitive in the industry.
          </motion.p>
          <motion.div
            className="mt-4"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Select>
              <SelectTrigger className="w-[200px] bg-white text-primary-blue">
                <SelectValue placeholder="View Pricing Structure" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary-blue">
                        Deal Value (₦)
                      </TableHead>
                      <TableHead className="text-primary-blue">
                        Buyer Fee
                      </TableHead>
                      <TableHead className="text-primary-blue">
                        Seller Fee
                      </TableHead>
                      <TableHead className="text-primary-blue">
                        Total Fee
                      </TableHead>
                      <TableHead className="text-primary-blue">
                        Strategic Rationale
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingStructure.map((tier, index) => (
                      <TableRow key={index}>
                        <TableCell>{tier.range}</TableCell>
                        <TableCell>{tier.buyerFee}</TableCell>
                        <TableCell>{tier.sellerFee}</TableCell>
                        <TableCell>{tier.totalFee}</TableCell>
                        <TableCell>{tier.rationale}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SelectContent>
            </Select>
          </motion.div>
          <motion.div
            className="mt-8"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            <motion.h3
              className="font-headline font-semibold text-3xl md:text-4xl text-white mb-2"
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
                "If agreed to pay all or some of the fee, it’s automatically added to the purchase price of the item you are buying",
              ].map((item, i) => (
                <motion.li
                  key={i}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
          <motion.div
            className="mt-8"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            <motion.h3
              className="font-headline font-semibold text-3xl md:text-4xl text-white mb-2"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Disbursement options for sellers and brokers
            </motion.h3>
            <motion.p
              className="text-lg text-white max-w-2xl"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              When a transaction begins, sellers and brokers can choose how
              they’d like to receive their funds. Once all terms are fulfilled
              and verified, Mountescrow credits the seller’s wallet. From there,
              the seller can easily request a withdrawal. Withdrawal processing
              follows the same timeline as standard transactions involving
              shared escrow fees. All agreed fees are deducted transparently,
              ensuring full accountability at every stage of the process.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
