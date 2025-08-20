import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container max-w-screen-xl mx-auto px-4 md:px-8 flex flex-col items-center justify-center">
        <div className="grid md:grid-cols-3 gap-10 w-full mb-8 ">
          {/* Column 1 - Logo + Intro */}
          <div className="flex flex-col justify-start items-start space-y-4">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FWEBlogoFooter.png?alt=media&token=107f6897-d8f0-42e6-a6f8-e6e232d335d2"
                alt="Mountescrow Logo"
                width={312}
                height={44.2}
                className="object-contain w-44 md:w-[312px] h-auto"
              />
            </Link>
            <p className="text-sm text-primary-foreground/80 text-left font-body">
              We are an independent escrow service provider working with
              licensed payment processors to ensure both buyers and sellers are
              happy with their transactions.
            </p>
            <div className="flex justify-start space-x-2 mt-2">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full"
              >
                <a href="#">
                  <Facebook className="text-white h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full"
              >
                <a href="#">
                  <Twitter className="text-white h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full"
              >
                <a href="#">
                  <Linkedin className="text-white h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Column 2 - Useful Links */}
          <div className="flex flex-col justify-start items-start space-y-3">
            <p className="font-headline text-2xl">USEFUL LINKS</p>
            <Link
              href="/why-mountescrow"
              className="block text-sm hover:underline text-primary-foreground/80 font-body"
            >
              Why Mountescrow?
            </Link>
            <Link
              href="/how-it-works"
              className="block text-sm hover:underline text-primary-foreground/80 font-body"
            >
              How It Works
            </Link>
            <Link
              href="/products"
              className="block text-sm hover:underline text-primary-foreground/80 font-body"
            >
              Products
            </Link>
            <Link
              href="/policies"
              className="block text-sm hover:underline text-primary-foreground/80 font-body"
            >
              Policies
            </Link>
          </div>

          {/* Column 3 - Contact + CTA */}
          <div className="flex flex-col justify-start items-start space-y-4">
            <p className="font-headline text-2xl">CONTACT US</p>
            <p className="text-sm text-primary-foreground/80 font-body">
              Got enquiries or wanna make a suggestion? We are open and happy to
              hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                asChild
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-primary"
              >
                <Link href="/contact-us">Contact Us</Link>
              </Button>
              <Button
                asChild
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 w-full pt-8 mt-8">
          <p className="text-center text-sm text-primary-foreground/60">
            &copy; {new Date().getFullYear()} Mountescrow. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
