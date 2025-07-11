"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const policyData = {
  "Dispute Resolution":
    "If either party is unsatisfied, Mountescrow’s resolution center will intervene and process a refund or release based on evidence and agreement terms.",
  "Privacy Policy":
    "No. Mountescrow does not sell or share user data with third parties. We respect your privacy and uphold data protection regulations.",
  "Terms of Use":
    "These Terms of Use ('Terms of Use' or 'Agreement') shall serve as an agreement that sets forth the general terms and conditions which govern your use and participation in the transaction management and escrow services provided on and through Mountescrow (the 'Services'). By selecting to utilize the Services you shall have also indicated your acceptance of these Terms of Use unless you shall have indicated your unwillingness to be bound by these Terms of Use.<br/><br /> 1. Definitions: 'Account' means an account of a Buyer from which payment for the Transaction and related fees will be obtained. (ii) an account of a Seller to which payment for the Transaction and related fees will be credited. 'Agreement' refers to this Agreement, the Transaction and other payments will be credited. 'Transaction Details' page means those pages on the Site where Users provide all required information connection with a Transaction, 'Escrow Instructions' or 'General Instructions' means those terms and conditions set forth on the Transaction Details page, as well as the other terms and conditions of the escrow transaction including these Terms of Use.<br/> <br /> 'Buyer Inspection Period' means the specific period as agreed to by the Parties within which the Buyer may inspect the Seller's receipt, in the absence of an escrow notice. In the context of delivery, means Mountescrow's notice to the Seller to ship the items after the deposit of funds by the Buyer in its Account. 'Inspection Period' means period between the following parties or as stated by the Seller's return policy. However, the default period is 5 days following the days of Buyer's notice of rejection, sent to Mountescrow.<br/><br /> 'User' means a buyer or seller utilizing the Services which completed normally. 'Transaction Completion Code' means a number combination generated on the Site or a plug in which indicates that the transaction was completed normally. Capitalized terms not defined herein shall have the same meaning as set forth in the General Instructions.",
};

export default function DisputeResolutionPage() {
  return (
    <div className="container py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="font-headline text-4xl md:text-5xl mb-4 text-primary">
          Policies & Terms
        </h1>
        <p className="lead mb-8 text-muted-foreground">
          Our policies and terms of use are designed to be fair, transparent,
          and efficient.
        </p>

        <Tabs defaultValue="Dispute Resolution" className="w-full text-left">
          {/* Stack tabs vertically on mobile and tablet, horizontal on desktop */}
          <TabsList
            className="flex flex-col lg:flex-row gap-2 lg:gap-4 justify-center items-center lg:items-stretch"
          >
            {Object.keys(policyData).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="w-full lg:w-auto text-center"
              >
                {key}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-8">
            {Object.entries(policyData).map(([key, value]) => (
              <TabsContent key={key} value={key}>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary">
                      {key}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: value.replace(/<br\/>/g, "<br>"),
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
