"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col md:flex-row w-full max-w-4xl bg-card rounded-lg shadow-lg overflow-hidden"
      >
        {/* Left Section (Contact Details) */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="relative text-white px-6 py-12 flex flex-col items-center justify-center w-full md:w-1/2"
        >
          <div className="absolute inset-0 bg-primary/90"></div>
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FcontactpageImage.jpg?alt=media&token=b99be386-f9d1-482b-970d-0b29bef72a5e"
            alt="Man on a phone call in an office"
            fill
            className="absolute inset-0 object-cover"
          />
          <div className="relative z-10 flex flex-col items-center">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="font-headline font-semibold text-3xl mb-4 text-center"
            >
              Contact Details
            </motion.h2>
            <p className="max-w-xs mb-6 text-center text-primary-foreground/80 font-headline">
              Get in touch with us using the following details or fill the form
              to leave a message. We love to hear from you.
            </p>
            <div className="space-y-6 flex flex-col items-center justify-center font-headline">
              {[
                { Icon: Phone, text: "+234 - 904 - 3970 - 401" },
                { Icon: Mail, text: "support@mountescrow.com" },
                {
                  Icon: MapPin,
                  text: (
                    <>
                      House A2, Basic Estate, Lokogoma, <br /> Abuja, Nigeria.
                    </>
                  ),
                },
              ].map(({ Icon, text }, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.2 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center text-center"
                >
                  <span className="mb-2 h-10 w-10 p-2 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                    <Icon className="text-primary-foreground" />
                  </span>
                  <p>{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Section (Form) */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="p-6 md:p-8 flex-1 w-full md:w-1/2"
        >
          <motion.form
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4 font-headline text-secondary-blue"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="E.g. Omoofe Bazunu"
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="E.g. raniem57@gmail.com"
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Preferably WhatsApp)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="E.g. +2349043970401"
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your message here"
                className="bg-muted min-h-[100px]"
              />
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-highlight-blue text-white"
              >
                Send Message
              </Button>
            </motion.div>
          </motion.form>
        </motion.div>
      </motion.div>
    </div>
  );
}
