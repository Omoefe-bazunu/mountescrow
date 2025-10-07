"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import UseCasesSection from "@/components/home/UseCasesSection";

export default function ProductsPage() {
  return (
    <>
      <div className="bg-white">
        <div className="container max-w-screen-xl mx-auto px-4 md:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Text Block */}
            <motion.div
              className="flex flex-col items-center md:items-start text-center md:text-left"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <motion.h1
                className="font-headline hidden font-semibold text-3xl md:text-4xl text-primary-blue mb-4 uppercase"
                initial={{ y: -30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7 }}
              >
                Our Products
              </motion.h1>

              <motion.h2
                className="font-headline uppercase font-semibold text-3xl md:text-4xl text-orange-500 max-w-xl mb-8"
                initial={{ x: -40, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.2 }}
              >
                MountEscrow. Built for Trust.{" "}
                <span className="text-primary-blue">
                  Secure Every Transaction.
                </span>
              </motion.h2>

              <motion.p
                className="text-secondary-blue max-w-xl mb-8 text-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
              >
                We serve as a trusted third party to guarantee that transaction
                terms are upheld. With Mountescrow, you can have complete
                confidence that everyone involved gets what they expect.
              </motion.p>
            </motion.div>

            {/* Animated Icon */}
            <motion.div
              className="flex-shrink-0 w-64 h-64 border-8 border-orange-500 rounded-full flex justify-center items-center"
              initial={{ scale: 0.7, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
              >
                <ShieldCheck size={80} className="text-primary" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Animate UseCases */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <UseCasesSection />
      </motion.div>
    </>
  );
}
