import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-card rounded-lg shadow-lg overflow-hidden">
        <div
          className="relative text-primary-foreground px-6 py-12 flex flex-col items-center justify-center w-full md:w-1/2"
        >
            <div className="absolute inset-0 bg-primary/90"></div>
             <Image
                src="https://placehold.co/600x800.png"
                alt="Man on a phone call in an office"
                layout="fill"
                objectFit="cover"
                className="absolute inset-0"
                data-ai-hint="contact background"
              />
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="font-headline text-3xl mb-4 text-center">Contact Details</h2>
            <p className="max-w-xs mb-6 text-center text-primary-foreground/80 font-body">
              Get in touch with us using the following details or fill the form
              to leave a message. We love to hear from you.
            </p>
            <div className="space-y-6 flex flex-col items-center justify-center font-body">
              <div className="flex flex-col items-center text-center">
                <span className="mb-2 h-10 w-10 p-2 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                  <Phone className="text-primary-foreground" />
                </span>
                <p>+234 - 904 - 3970 - 401</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="mb-2 h-10 w-10 p-2 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                  <Mail className="text-primary-foreground" />
                </span>
                <p>support@mountescrow.com</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="mb-2 h-10 w-10 p-2 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                  <MapPin className="text-primary-foreground" />
                </span>
                <p>
                  3, Ajomo Road, Hilltop Avenue,
                  <br /> FCT, Abuja
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-8 flex-1 w-full md:w-1/2">
          <form className="space-y-4 font-body">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="E.g. Omoofe Bazunu"
                className="bg-muted"
                aria-label="Your Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="E.g. raniem57@gmail.com"
                className="bg-muted"
                 aria-label="Your Email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Preferably WhatsApp)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="E.g. +2349043970401"
                className="bg-muted"
                 aria-label="Your Phone Number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your message here"
                className="bg-muted min-h-[100px]"
                 aria-label="Your Message"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
