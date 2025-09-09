"use client";

import { motion } from "framer-motion";
import FaqSection from "@/components/home/FaqSection";
import OurStory from "@/components/home/OurStory";
import Image from "next/image";

export default function WhyMountescrowPage() {
  return (
    <>
      <div className="container max-w-screen-xl mx-auto px-4 md:px-8 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Text Section */}
          <motion.div
            className="flex flex-col items-center md:items-start text-center md:text-left max-w-2xl"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              className="font-headline font-semibold text-3xl md:text-4xl text-primary mb-4 uppercase"
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              Why Use Mountescrow?
            </motion.h1>

            <motion.h2
              className="font-headline font-semibold text-2xl md:text-3xl text-accent mb-4"
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              WE PRIORITIZE TRUST, SECURITY, EFFICIENCY &amp; RELIABILITY
            </motion.h2>

            <motion.p
              className="text-muted-foreground text-lg mb-4 font-body"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              We have collaborated with a reliable and trusted deposit money
              bank in Nigeria to provide you with a simple, transparent, and
              secured payment method for your transactions. Making it easy,
              convenient and safe to do business anywhere, even if you don’t
              know or trust anyone.
            </motion.p>
          </motion.div>

          {/* Animated Image */}
          <motion.div
            className="w-[250px] h-[250px] border-4 border-accent rounded-full flex-shrink-0 bg-cover bg-no-repeat bg-center relative overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FWHYCHOOSEIMAGE.jpg?alt=media&token=55fb1b0e-e465-4a66-8e6a-fb647b91d5a1"
              alt="A person smiling, representing a secure transaction"
              fill
              className="object-cover"
              data-ai-hint="secure transaction"
            />
          </motion.div>
        </div>
      </div>

      {/* Animate OurStory */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <OurStory />
      </motion.div>

      {/* Animate FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <FaqSection />
      </motion.div>
    </>
  );
}
