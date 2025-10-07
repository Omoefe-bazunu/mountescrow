"use client";

import React from "react";
import { motion } from "framer-motion";

export default function FeesBreakdown() {
  return (
    <motion.div
      className="w-full bg-background"
      style={{
        backgroundImage:
          "url('https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FfeesbreakdownBgImage.jpg?alt=media&token=fa1a900a-7233-4ae5-8074-e3d333a6af84')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      data-ai-hint="abstract pattern"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="container max-w-screen-xl mx-auto px-4 md:px-8 py-16 font-body">
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
          {/* Title */}
          <motion.h2
            className="font-headline font-semibold text-3xl md:text-4xl text-primary-blue mb-2"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            Fee Breakdown
          </motion.h2>

          {/* Intro paragraph */}
          <motion.p
            className="text-lg text-secondary-blue max-w-2xl"
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

          {/* Buyers section */}
          <motion.div
            className="mt-8"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            <motion.h3
              className="font-headline font-semibold text-3xl md:text-4xl text-primary-blue mb-2"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Payment options for buyers
            </motion.h3>
            <motion.ul className="text-lg text-secondary-blue list-disc list-inside mt-2 max-w-2xl space-y-1">
              {[
                "Credit & Debit Card",
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

          {/* Sellers section */}
          <motion.div
            className="mt-8"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            <motion.h3
              className="font-headline font-semibold text-3xl md:text-4xl text-primary-blue mb-2"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Disbursement options for sellers and brokers
            </motion.h3>
            <motion.p
              className="text-lg text-secondary-blue max-w-2xl"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Upon initiating a transaction, sellers and brokers have the
              freedom to specify their preferred disbursement method. Once all
              transaction terms are met and verified, Mountescrow will credit
              the seller’s wallet. From there, the seller can easily request a
              withdrawal or their funds. The processing time for withdrawals is
              the same as the next amount for transactions involving shared
              escrow fees. The agreed-upon amount will be deducted transparently
              from either the purchase accountability throughout the process.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
