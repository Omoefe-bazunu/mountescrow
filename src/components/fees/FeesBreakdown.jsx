import React from "react";

export default function FeesBreakdown() {
  return (
    <div
      className="w-full bg-background"
      style={{
        backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FfeesbreakdownBgImage.jpg?alt=media&token=8521529b-2f10-4833-b741-fd7e7d2fa193')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      data-ai-hint="abstract pattern"
    >
      <div className="container max-w-screen-xl mx-auto px-4 md:px-8 py-16 font-body">
        <div className="mt-6">
        <h2 className="font-headline text-3xl md:text-4xl text-primary mb-2">
  Fee Breakdown
</h2>
<p className="text-lg text-muted-foreground max-w-2xl">
  Every transaction on our platform is subject to a dynamic fee based on the total deal value. This fee covers processing, escrow, and disbursement services. It starts at <strong>10%</strong> for smaller deals and decreases to as low as <strong>1%</strong> for ultra-high-value transactions. The fee can be paid entirely by one party or split between the buyer and seller at varying percentages, offering flexibility and fairness. Our pricing is among the most competitive in the industry.
</p>

          <div className="mt-8">
            <h3 className="font-headline text-3xl md:text-4xl text-primary mb-2">
              Payment options for buyers
            </h3>
            <ul className="text-lg text-muted-foreground list-disc list-inside mt-2 max-w-2xl space-y-1">
              <li>Credit & Debit Card</li>
              <li>Bank Transfer</li>
              <li>
                If agreed to pay all or some of the fee, it’s automatically
                added to the purchase price of the item you are buying
              </li>
            </ul>
          </div>
          <div className="mt-8">
            <h3 className="font-headline text-3xl md:text-4xl text-primary mb-2">
              Disbursement options for sellers and brokers
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Upon initiating a transaction, sellers and brokers have the
              freedom to specify their preferred disbursement method. Once all
              transaction terms are met and verified, Mountescrow will credit
              the seller’s wallet. From there, the seller can easily request a
              withdrawal or their funds. The processing time for withdrawals is
              the same as the next amount for transactions involving shared
              escrow fees. The agreed-upon amount will be deducted transparently
              from either the purchase accountability throughout the process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
