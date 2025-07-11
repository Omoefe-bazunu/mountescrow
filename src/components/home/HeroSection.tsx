import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <div className="bg-background">
      <section className=" py-16  flex flex-col items-center justify-between gap-10 max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="max-w-xl flex flex-col items-center text-center">
          <h1 className=" text-accent font-headline text-4xl md:text-5xl mb-4">
            A SAFE & SECURE WAY TO{" "}
            <span className=" text-primary">TRADE</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-6 font-body">
            Protect your transactions and trade with your mind at ease using
            Mountescrow — your safe escrow solution for buying, selling,
            renting, and paying online.
          </p>
          <div className="flex gap-4">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>

        <div className="w-full max-w-md">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FheroImage.jpg?alt=media&token=d99997e5-ee0c-4b58-9605-c8397c988cf4"
            alt="Mountescrow handshake"
            width={500}
            height={500}
            data-ai-hint="handshake deal"
            className="rounded-md object-contain"
          />
        </div>
      </section>
    </div>
  );
}
