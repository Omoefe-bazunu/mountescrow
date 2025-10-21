"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FeesBreakdown from "@/components/fees/FeesBreakdown";
import FaqSection from "@/components/home/FaqSection";

export default function FeeCalculatorPage() {
  const [amount, setAmount] = useState(2000);
  const [buyerFee, setBuyerFee] = useState(0);
  const [sellerFee, setSellerFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [totalFeePercent, setTotalFeePercent] = useState(0);

  const calculateFees = (value) => {
    const dealValue = parseFloat(value) || 0;
    let buyerFeePercent, sellerFeePercent, totalFeePercent;

    if (dealValue <= 1000000) {
      buyerFeePercent = 5;
      sellerFeePercent = 5;
      totalFeePercent = 10;
    } else if (dealValue <= 5000000) {
      buyerFeePercent = 2.5;
      sellerFeePercent = 2.5;
      totalFeePercent = 5;
    } else if (dealValue <= 50000000) {
      buyerFeePercent = 2;
      sellerFeePercent = 2;
      totalFeePercent = 4;
    } else if (dealValue <= 200000000) {
      buyerFeePercent = 1.5;
      sellerFeePercent = 1.5;
      totalFeePercent = 3;
    } else if (dealValue <= 1000000000) {
      buyerFeePercent = 1;
      sellerFeePercent = 1;
      totalFeePercent = 2;
    } else {
      buyerFeePercent = 0.5;
      sellerFeePercent = 0.5;
      totalFeePercent = 1;
    }

    setBuyerFee((dealValue * buyerFeePercent) / 100);
    setSellerFee((dealValue * sellerFeePercent) / 100);
    setTotalFee((dealValue * totalFeePercent) / 100);
    setTotalFeePercent(totalFeePercent);
  };

  const handleCalculate = () => {
    calculateFees(amount);
  };

  return (
    <>
      <div
        className="font-body"
        style={{
          backgroundImage:
            "url('https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FhowMountescrowWorksImage.jpg?alt=media&token=cedd54b5-52ea-462e-9df5-363b79a82276')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <div className="container max-w-screen-xl mx-auto px-4 md:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-md w-full bg-white p-8 rounded-lg shadow-md"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="font-headline font-semibold text-3xl md:text-4xl text-primary-blue mb-4"
              >
                Calculate Your Escrow Fee
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="text-lg text-secondary-blue mb-6"
              >
                Calculate the exact amount we are charging for helping you hold
                your funds until your transaction is completed.
              </motion.p>
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
                      placeholder="E.g. 2000.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
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
                    <Button
                      className="w-full bg-orange-500 hover:bg-highlight-blue text-white"
                      onClick={handleCalculate}
                    >
                      Calculate
                    </Button>
                  </motion.div>
                </motion.div>
                {totalFee > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg text-secondary-blue"
                  >
                    <p>Buyer Fee: ₦{buyerFee.toLocaleString()}</p>
                    <p>Seller Fee: ₦{sellerFee.toLocaleString()}</p>
                    <p>
                      Total Fee: ₦{totalFee.toLocaleString()} ({totalFeePercent}
                      %)
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
            <motion.div
              className="flex-shrink-0 hidden w-64 h-64 border-8 border-white rounded-full justify-center items-center overflow-hidden bg-white shadow-lg"
              initial={{ scale: 0.7, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <img
                src="https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FIcon%204.png?alt=media&token=6361b112-5fb9-4698-846a-bf8b58e45d9b"
                alt="Centered Image"
                className="w-full h-full object-cover rounded-full"
              />
            </motion.div>
          </div>
        </div>
      </div>
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
