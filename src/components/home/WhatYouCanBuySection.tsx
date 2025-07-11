export default function WhatYouCanBuySection() {
  return (
    <div
      className="bg-background"
      style={{
        backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FwhyyoushoulduseusbgImage.jpg?alt=media&token=e7a526e4-851d-4804-b3d2-1d60b2144d58')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      data-ai-hint="market products"
    >
      <section className=" py-20 text-center max-w-screen-xl mx-auto px-4 md:px-8">
        <h2 className="text-primary-foreground font-headline text-3xl md:text-4xl  mb-6">
          WHAT YOU CAN BUY & SELL USING MOUNTESCROW
        </h2>
        <p className="text-primary-foreground max-w-3xl mx-auto mb-12 font-body">
          Mountescrow gives you an opportunity to engage in a wide range of
          buying and selling activities, ranging from physical items to digital
          services. If it requires payment protection and trust, Mountescrow
          covers you.
        </p>

        <div className="grid gap-6 md:grid-cols-3 text-left">
          <div className="bg-card p-6 rounded shadow">
            <h3 className="text-primary font-headline text-2xl mb-2">PHYSICAL PRODUCTS</h3>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 font-body">
              <li>General Electronics</li>
              <li>Mobile Devices</li>
              <li>Gadgets and Accessories</li>
              <li>Appliances</li>
              <li>Fashion items</li>
            </ul>
          </div>

          <div className="bg-card p-6 rounded shadow">
            <h3 className="text-primary font-headline text-2xl mb-2">DIGITAL PRODUCTS</h3>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 font-body">
              <li>Web Development</li>
              <li>Design Projects</li>
              <li>Courses (PDF, Video, and eLearning)</li>
              <li>Templates & Licensable Goods</li>
              <li>Downloadable Content</li>
            </ul>
          </div>

          <div className="bg-card p-6 rounded shadow">
            <h3 className="text-primary font-headline text-2xl mb-2">SERVICES</h3>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 font-body">
              <li>Freelance & Contract Jobs</li>
              <li>Professional Service Engagements</li>
              <li>Consulting, Advisory & Business Services</li>
              <li>Real Estate Payments</li>
              <li>Vendor Bookings</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
