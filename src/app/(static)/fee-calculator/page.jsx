"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FeesBreakdown from "@/components/fees/FeesBreakdown";
import FaqSection from "@/components/home/FaqSection";

export default function FeeCalculatorPage() {
  return (
    <>
      <div
        className=" font-body"
        style={{
          backgroundImage:
            "url('https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FfeesbreakdownBgImage.jpg?alt=media&token=fa1a900a-7233-4ae5-8074-e3d333a6af84')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <div className="container max-w-screen-xl mx-auto px-4 md:px-8 py-16">
          {/* Card animation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-md w-full bg-card p-8 rounded-lg shadow-md"
          >
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-headline font-semibold text-3xl md:text-4xl text-primary-blue mb-4"
            >
              Calculate Your Escrow Fee
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-lg text-secondary-blue mb-6"
            >
              Calculate the exact amount we are charging for helping you hold
              your funds until your transaction is completed.
            </motion.p>

            {/* Inputs & Button */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.15 } },
              }}
              className="space-y-4"
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Label htmlFor="amount">Amount to hold</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="E.g. 2,000.00"
                    defaultValue="2000.00"
                  />
                  <Select defaultValue="ngn">
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ngn">NGN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button className="w-full bg-primary-blue hover:bg-highlight-blue text-white">
                    Calculate
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Fade in other sections */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <FeesBreakdown />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <FaqSection />
      </motion.div>
    </>
  );
}
