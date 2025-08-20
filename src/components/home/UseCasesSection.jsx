import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function UseCasesSection() {
  return (
    <div className="bg-background">
      <section className=" py-16  text-center max-w-screen-xl mx-auto px-4 md:px-8">
        <h2 className="text-primary font-headline text-3xl md:text-4xl  mb-6">
          PRODUCTS OF MOUNTESCROW
        </h2>
        <div className="grid gap-6 md:grid-cols-2 text-left text-sm md:text-base">
          <div className="border border-border p-4 rounded-lg flex flex-col">
            <div
              className=" w-full h-80 rounded-lg mb-6 border-b-4 border-card relative overflow-hidden"
            >
              <Image 
                src="https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FescrowServiceImage.jpg?alt=media&token=f204bd5e-aa16-481b-bb95-e6f031a0ff1d"
                alt="A visual representation of a secure payment link"
                layout="fill"
                objectFit="cover"
                data-ai-hint="payment link"
              />
            </div>
            <h3 className="text-primary mb-2 font-headline text-2xl">
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
          </div>
          <div className="border border-border p-4 rounded-lg flex flex-col ">
            <div
              className=" w-full h-80 rounded-lg mb-6 border-b-4 border-card relative overflow-hidden"
            >
              <Image 
                src="https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FapiserviceImage.jpg?alt=media&token=ad52e6da-a216-4f5c-8396-6a13eb4f1c19"
                alt="Code on a screen representing API integration"
                layout="fill"
                objectFit="cover"
                data-ai-hint="api integration code"
              />
            </div>
            <h3 className="text-primary mb-2 font-headline text-2xl">
              B2B ESCROW API INTEGRATION
            </h3>
            <p className="text-muted-foreground flex-grow font-body">
              Integrate Mountescrow escrow service into your business platform
              to securely safeguard funds until specific conditions are met. Our
              B2B API is highly customizable to meet unique needs of diverse
              businesses and scalable to accommodate growth.
            </p>
            <Button asChild className="w-fit mt-2">
              <Link href="/contact-us">Integrate Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
