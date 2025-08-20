import Image from "next/image";

export default function TestimonialsSection() {
  return (
    <section
      className="bg-background py-20 px-4 md:px-20 text-center"
      style={{
        backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FtestimonialbgImage.jpg?alt=media&token=8cdbd7ca-ff97-4e4d-8fcf-30bae9dacfda')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      data-ai-hint="abstract pattern"
    >
      <h2 className="text-primary font-headline text-3xl md:text-4xl mb-6">
        HEAR FROM OUR USERS
      </h2>
      <p className="text-muted-foreground max-w-3xl mx-auto mb-12 font-body">
        Hear from those who already use Mountescrow to power safe and secure
        payments.
      </p>

      <div className="grid gap-10 md:grid-cols-3 text-left">
        <div className="bg-card p-6 rounded shadow flex flex-col">
          <p className="text-card-foreground italic mb-4 font-body">
            “Mountescrow gave me peace of mind during a high-value project. I
            didn’t have to worry about payment.”
          </p>
          <div className="flex items-center gap-4">
            <Image
              src="https://placehold.co/50x50.png"
              alt="Avatar of Adaeze M."
              width={50}
              height={50}
              data-ai-hint="person avatar"
              className="rounded-full object-cover"
            />
            <div>
              <p className="text-primary font-semibold">Adaeze M.</p>
              <p className="text-sm text-muted-foreground">Freelancer</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded shadow flex flex-col">
          <p className="text-card-foreground italic mb-4 font-body">
            “The delivery didn’t go as planned but the dispute system worked
            perfectly. I got my refund fast.”
          </p>
          <div className="flex items-center gap-4">
            <Image
              src="https://placehold.co/50x50.png"
              alt="Avatar of Blessing O."
              width={50}
              height={50}
              data-ai-hint="person avatar"
              className="rounded-full object-cover"
            />
            <div>
              <p className="text-primary font-semibold">Blessing O.</p>
              <p className="text-sm text-muted-foreground">Online Buyer</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded shadow flex flex-col">
          <p className="text-card-foreground italic mb-4 flex-grow font-body">
            “Mountescrow helped my small business gain customer trust and
            complete sales quicker.”
          </p>
          <div className="flex items-center gap-4">
            <Image
              src="https://placehold.co/50x50.png"
              alt="Avatar of Chuka N."
              width={50}
              height={50}
              data-ai-hint="person avatar"
              className="rounded-full object-cover"
            />
            <div>
              <p className="text-primary font-semibold">Chuka N.</p>
              <p className="text-sm text-muted-foreground">Vendor</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
