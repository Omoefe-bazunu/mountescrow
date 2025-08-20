export default function HowItWorksPage() {
    return (
        <div className="container py-12 md:py-20">
            <div className="prose lg:prose-xl max-w-4xl mx-auto">
                <h1 className="font-headline text-5xl mb-4 text-primary">How It Works</h1>
                <p className="lead mb-6">A simple, transparent process in three easy steps.</p>
                
                <div className="space-y-8">
                    <div>
                        <h2 className="font-headline text-3xl text-primary">1. Agree on Terms</h2>
                        <p>The buyer and seller create a proposal outlining the terms of the deal, including milestones and payment amounts. Once both parties agree, the deal is initiated.</p>
                    </div>
                    <div>
                        <h2 className="font-headline text-3xl text-primary">2. Secure Funding</h2>
                        <p>The buyer securely deposits funds into the Mountescrow protected account. We verify the payment and notify the seller that it's safe to begin work.</p>
                    </div>
                    <div>
                        <h2 className="font-headline text-3xl text-primary">3. Release Payment</h2>
                        <p>Once a milestone is complete and approved by the buyer, we release the corresponding payment to the seller. This continues until the deal is finished, ensuring satisfaction for both parties.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
