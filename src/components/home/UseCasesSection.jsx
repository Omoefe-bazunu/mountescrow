"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function UseCasesSection() {
  return (
    <div className="bg-background">
      <section className="py-16 text-center max-w-screen-xl mx-auto px-4 md:px-8">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-primary font-semibold font-headline text-3xl md:text-4xl mb-6"
        >
          PRODUCTS OF MOUNTESCROW
        </motion.h2>

        {/* Grid of Cards */}
        <div className="grid gap-6 md:grid-cols-2 text-left text-sm md:text-base">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="border border-border p-4 rounded-lg flex flex-col"
          >
            <div className="w-full h-80 rounded-lg mb-6 border-b-4 border-card relative overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <Image
                  src="https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FescrowServiceImage.jpg?alt=media&token=f204bd5e-aa16-481b-bb95-e6f031a0ff1d"
                  alt="A visual representation of a secure payment link"
                  fill
                  className="object-cover rounded-lg"
                />
              </motion.div>
            </div>
            <h3 className="text-primary font-semibold mb-2 font-headline text-2xl">
              Escrow Payment Invite
            </h3>
            <p className="text-muted-foreground flex-grow font-body">
              Simply set up and share a payment link with the buyer. Mountescrow
              takes care of the rest - receive and secure the funds until the
              buyer and the seller meet transaction terms.
            </p>
            <Button asChild className="bg-accent hover:bg-accent/90 w-fit mt-2">
              <Link href="/proposals">Create Payment Link</Link>
            </Button>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="border border-border p-4 rounded-lg flex flex-col"
          >
            <div className="w-full h-80 rounded-lg mb-6 border-b-4 border-card relative overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <Image
                  src="https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FapiserviceImage.jpg?alt=media&token=ad52e6da-a216-4f5c-8396-6a13eb4f1c19"
                  alt="Code on a screen representing API integration"
                  fill
                  className="object-cover rounded-lg"
                />
              </motion.div>
            </div>
            <h3 className="text-primary font-semibold mb-2 font-headline text-2xl">
              B2B ESCROW API INTEGRATION
            </h3>
            <p className="text-muted-foreground flex-grow font-body">
              Integrate Mountescrow escrow service into your business platform
              to securely safeguard funds until specific conditions are met. Our
              B2B API is highly customizable to meet unique needs of diverse
              businesses and scalable to accommodate growth.
            </p>
            <Button asChild className="w-fit mt-2">
              <Link href="#">Coming Soon</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
