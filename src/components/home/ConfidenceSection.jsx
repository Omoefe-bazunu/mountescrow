import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function ConfidenceSection() {
  return (
    <div className="bg-primary ">
      <section className="py-16 flex flex-col items-center text-center relative max-w-screen-xl mx-auto px-4 md:px-8">
        <h2 className="text-primary-foreground font-headline text-3xl md:text-4xl mb-6">
          BUY AND SELL WITH ABSOLUTE CONFIDENCE
        </h2>
        <p className="text-primary-foreground max-w-3xl mx-auto mb-6 font-body">
          Whether you are buying, hiring, or renting — to ensure your customers’
          comfort, Mountescrow brings the assurance of neutrality and trust.
          Each transaction is transparently tracked so buyers and sellers both
          reach mutual satisfaction.
        </p>
        <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/signup">Get Started</Link>
        </Button>

        <div className="grid gap-8 md:grid-cols-3 text-left mt-6 mb-[60px] md:mb-[100px]">
          <div className="bg-card p-6 rounded-md shadow-sm">
            <p className="text-primary font-semibold mb-2">
              Buy confidently from unfamiliar sellers
            </p>
            <p className="text-muted-foreground font-body">
              Get products delivered as promised. Avoid potential scams and
              fraudulent sellers.
            </p>
          </div>

          <div className="bg-card p-6 rounded-md shadow-sm">
            <p className="text-primary font-semibold mb-2">
              Get compensated for sub-par deliveries
            </p>
            <p className="text-muted-foreground font-body">
              Disputes resolved with increased buyer confidence and faster
              turnaround time.
            </p>
          </div>

          <div className="bg-card p-6 rounded-md shadow-sm">
            <p className="text-primary font-semibold mb-2">
              Sell with increased buyer confidence
            </p>
            <p className="text-muted-foreground font-body">
              Eliminate buyer hesitation, close deals faster.
            </p>
          </div>
        </div>
        <div className="w-fit h-fit mx-auto mb-8 absolute -bottom-[170px] md:-bottom-[200px] left-1/2 transform -translate-x-1/2">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FwhatyoucanbuyImage.jpg?alt=media&token=4cd4027b-db7e-425f-8195-656549a57a52"
            alt="A person joyfully looking at a laptop, symbolizing a successful payment."
            width={300}
            height={300}
            data-ai-hint="payment received"
            className="rounded-full object-cover border-8 border-primary shadow-lg"
          />
        </div>
      </section>
    </div>
  );
}
