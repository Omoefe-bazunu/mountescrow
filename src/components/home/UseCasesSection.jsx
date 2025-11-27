"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function UseCasesSection() {
  return (
    <div className="bg-gray-100">
      <section className="py-16 text-center max-w-screen-xl mx-auto px-4 md:px-8">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-primary-blue font-semibold font-headline text-3xl md:text-4xl mb-6"
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
            <div className="w-full aspect-[4/3] rounded-lg mb-6 border-b-4 border-card relative overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <Image
                  src="https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FGemini_Generated_Image_q5ob7rq5ob7rq5ob%20(1).png?alt=media&token=a5f98888-78b3-40cd-b8c5-3a2a9f4a63f4"
                  alt="A visual representation of a secure payment transaction"
                  width={800}
                  height={600}
                  className="object-cover rounded-lg w-full h-full"
                />
              </motion.div>
            </div>
            <h3 className="text-primary-blue uppercase font-semibold mb-2 font-headline text-2xl">
              Escrow Payment Invite
            </h3>
            <p className="text-secondary-blue flex-grow font-headline">
              Simply set up and share a payment link with the buyer. Mountescrow
              takes care of the rest - receive and secure the funds until the
              buyer and the seller meet transaction terms.
            </p>
            <Button
              asChild
              className="bg-orange-500 text-white hover:bg-highlight-blue w-fit mt-2"
            >
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
            <div className="w-full aspect-[4/3] rounded-lg mb-6 border-b-4 border-card relative overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <Image
                  src="https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FGemini_Generated_Image_smij1dsmij1dsmij%20(1).png?alt=media&token=7557047c-7a80-4c45-aa06-cad965f8f95e"
                  alt="A visual representation of API integration session"
                  width={800}
                  height={600}
                  className="object-cover rounded-lg w-full h-full"
                />
              </motion.div>
            </div>
            <h3 className="text-primary-blue uppercase font-semibold mb-2 font-headline text-2xl">
              B2B ESCROW API INTEGRATION
            </h3>
            <p className="text-secondary-blue flex-grow font-headline">
              Integrate Mountescrow escrow service into your business platform
              to securely safeguard funds until specific conditions are met. Our
              B2B API is highly customizable to meet unique needs of diverse
              businesses and scalable to accommodate growth.
            </p>
            <Button asChild className="w-fit bg-gray-600 text-white mt-2">
              <Link href="#">Coming Soon</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
