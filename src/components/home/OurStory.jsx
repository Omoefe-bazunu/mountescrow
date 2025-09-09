export default function OurStory() {
  return (
    <div
      className="py-16 bg-primary"
      style={{
        backgroundImage:
          "url('https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FourStoryBgImage.jpg?alt=media&token=666d65ed-ff5f-4bf9-a4a8-2f7c3f937f03')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      data-ai-hint="abstract pattern"
    >
      <div className=" text-primary-foreground rounded-lg">
        <h2 className="font-headline font-semibold text-3xl md:text-4xl mb-4 text-center">
          OUR STORY
        </h2>
        <div className="px-8 md:px-16 mx-auto">
          <p className="font-body text-lg text-center md:text-left">
            Mountescrow was founded with a bold vision: to transform digital
            transactions into a secure, transparent, and empowering ecosystem
            for buyers and sellers alike. We understand the hurdles of online
            commerce—fears of fraud, distrust in unfamiliar parties, and the
            need for seamless payment safety. This drove us to create a solution
            that fosters confidence and eliminates uncertainty in every deal.
          </p>
          <p className="font-body text-lg mt-4 text-center md:text-left">
            Mountescrow acts as a steadfast partner, ensuring funds are
            protected until transaction terms are met. Fostering collaboration
            and trust between parties. Beyond single transactions, we are
            building a future where trust defines commerce. Our innovative
            milestone-based payments streamline project workflows, while our
            multi-party transaction services simplify even the most complex
            deals.
          </p>
        </div>
      </div>
    </div>
  );
}
