import { Handshake, ShieldCheck, Truck, ThumbsUp, HandCoins } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <div
      className="bg-background"
      style={{
        backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FhowMountescrowWorksImage.jpg?alt=media&token=c4018604-278f-46e8-ada2-eb9ab864a8e2')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      data-ai-hint="abstract background"
    >
      <section
        id="how-it-works"
        className=" py-20 text-center max-w-screen-xl mx-auto px-4 md:px-8"
      >
        <div className="max-w-5xl mx-auto mt-[120px] md:mt-[140px]">
          <h2 className="text-primary font-headline text-3xl md:text-4xl mb-4">
            HOW MOUNTESCROW WORKS
          </h2>

          <p className="text-muted-foreground max-w-2xl mx-auto mb-10 font-body">
            Buyers and sellers can be rest assured that their money and valuable
            products for every transaction is secured every step of the way. We
            are more than just a digital escrow transaction platform. We ensure
            the balance of seamless, safe and secure transactions.
          </p>

          <div className="grid gap-6 md:grid-cols-5 text-center text-sm md:text-base text-primary">
            <div className="flex flex-col items-center">
              <div className=" bg-primary h-24 w-24 rounded-full flex items-center justify-center mb-2 relative border-4 border-card">
                <div className=" font-bold text-2xl absolute -top-3 -left-1 mb-2 text-primary rounded-full bg-card w-10 h-10 flex items-center justify-center mx-auto">
                  1
                </div>
                <Handshake size={50} className="text-primary-foreground" />
              </div>
              <p className="font-body">Buyer and Seller agree on terms</p>
            </div>
            <div className="flex flex-col items-center">
              <div className=" bg-primary h-24 w-24 rounded-full flex items-center justify-center mb-2 relative border-4 border-card">
                <div className=" font-bold text-2xl absolute -top-3 -left-1 mb-2 text-primary rounded-full bg-card w-10 h-10 flex items-center justify-center mx-auto">
                  2
                </div>
                <ShieldCheck size={50} className="text-primary-foreground" />
              </div>
              <p className="font-body">Buyer funds escrow via Mountescrow</p>
            </div>
            <div className="flex flex-col items-center">
              <div className=" bg-primary h-24 w-24 rounded-full flex items-center justify-center mb-2 relative border-4 border-card">
                <div className=" font-bold text-2xl absolute -top-3 -left-1 mb-2 text-primary rounded-full bg-card w-10 h-10 flex items-center justify-center mx-auto">
                  3
                </div>
                <Truck size={50} className="text-primary-foreground" />
              </div>
              <p className="font-body">Seller delivers order to buyer</p>
            </div>
            <div className="flex flex-col items-center">
              <div className=" bg-primary h-24 w-24 rounded-full flex items-center justify-center mb-2 relative border-4 border-card">
                <div className=" font-bold text-2xl absolute -top-3 -left-1 mb-2 text-primary rounded-full bg-card w-10 h-10 flex items-center justify-center mx-auto">
                  4
                </div>
                <ThumbsUp size={45} className="text-primary-foreground" />
              </div>
              <p className="font-body">Buyer approves order</p>
            </div>
            <div className="flex flex-col items-center">
              <div className=" bg-primary h-24 w-24 rounded-full flex items-center justify-center mb-2 relative border-4 border-card">
                <div className=" font-bold text-2xl absolute -top-3 -left-1 mb-2 text-primary rounded-full bg-card w-10 h-10 flex items-center justify-center mx-auto">
                  5
                </div>
                <HandCoins size={50} className="text-primary-foreground" />
              </div>
              <p className="font-body">Mountescrow releases payment to seller</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
