import FaqSection from "@/components/home/FaqSection";
import OurStory from "@/components/home/OurStory";
import Image from "next/image";

export default function WhyMountescrowPage() {
    return (
        <>
            <div className="container max-w-screen-xl mx-auto px-4 md:px-8 py-16">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-2xl">
                        <h1 className="font-headline text-3xl md:text-4xl text-primary mb-4 uppercase">
                            Why Use Mountescrow?
                        </h1>
                        <h2 className="font-headline text-2xl md:text-3xl text-accent mb-4">
                            WE PRIORITIZE TRUST, SECURITY, EFFICIENCY &amp; RELIABILITY
                        </h2>
                        <p className="text-muted-foreground text-lg mb-4 font-body">
                            We have collaborated with a reliable and trusted deposit money
                            bank in Nigeria to provide you with a simple, transparent, and
                            secured payment method for your transactions. Making it easy,
                            convenient and safe to do business anywhere, even if you don’t
                            know or trust anyone.
                        </p>
                    </div>
                    <div
                        className="w-[250px] h-[250px] border-4 border-accent rounded-full flex-shrink-0 bg-cover bg-no-repeat bg-center relative overflow-hidden"
                    >
                       <Image 
                         src="https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FWHYCHOOSEIMAGE.jpg?alt=media&token=55fb1b0e-e465-4a66-8e6a-fb647b91d5a1"
                         alt="A person smiling, representing a secure transaction"
                         layout="fill"
                         objectFit="cover"
                         data-ai-hint="secure transaction"
                        />
                    </div>
                </div>
            </div>
            <OurStory />
            <FaqSection />
        </>
    );
}
