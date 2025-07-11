import { ShieldCheck } from "lucide-react";
import UseCasesSection from "@/components/home/UseCasesSection";

export default function ProductsPage() {
  return (
    <>
      <div className="bg-white">
        <div className="container max-w-screen-xl mx-auto px-4 md:px-8 py-16 ">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h1 className="font-headline text-3xl md:text-4xl text-primary mb-4 uppercase">
                Our Products
              </h1>
              <h2 className="font-headline text-3xl md:text-4xl text-accent max-w-xl mb-8">
                AN ESCROW PLATFORM YOU CAN{" "}
                <span className="text-primary">TRUST</span> WITH YOUR{" "}
                <span className="text-primary">FUNDS</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mb-8 text-lg">
                We serve as a trusted third party to guarantee that transaction
                terms are upheld. With Mountescrow, you can have complete
                confidence that everyone involved gets what they expect.
              </p>
            </div>
            <div className="flex-shrink-0 w-64 h-64 border-8 border-accent rounded-full flex justify-center items-center">
              <ShieldCheck size={80} className="text-primary" />
            </div>
          </div>
        </div>
      </div>
      <UseCasesSection />
    </>
  );
}
