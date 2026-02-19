"use client";

import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Scale, ShieldCheck, RefreshCcw, FileText } from "lucide-react";

const POLICIES_DATA = {
  "Privacy Policy": {
    icon: <ShieldCheck className="h-6 w-6" />,
    content: `Effective Date: February 6th, 2026

Mountescrow is committed to protecting your privacy and safeguarding your financial data. This Privacy Policy explains how we collect, use, disclose, and protect your information.

1. INFORMATION WE COLLECT
A. Personal Information: Full name, Email address, Phone number, Date of birth, Government-issued ID (for KYC verification), Selfie or biometric verification (where required).
B. Financial Information: Bank account details, Payment card details (processed securely via licensed payment providers), Transaction history, Wallet balances.
C. Device & Technical Information: IP address, Device type, Operating system, App version, Log data.
D. Usage Information: Transaction activity, Support inquiries, In-app interactions.

2. HOW WE USE YOUR INFORMATION
We use your information to: verify your identity (KYC/AML compliance), process escrow transactions, facilitate payments and withdrawals, prevent fraud and unauthorized access, provide customer support, improve platform performance, and comply with legal and regulatory obligations. We do not sell your personal information.

3. LEGAL BASIS FOR PROCESSING
We process your data based on contractual necessity, legal obligations (financial compliance, AML laws), legitimate business interests (fraud prevention, platform improvement), and user consent where required.

4. DATA SHARING & DISCLOSURE
We may share your data with licensed payment processors, banking partners, identity verification providers, regulatory authorities when legally required, and fraud prevention services. All third-party partners are contractually required to protect your data. We do not sell or rent your personal data to advertisers.

5. DATA STORAGE & SECURITY
Mountescrow implements industry-standard security measures including end-to-end encryption, secure servers, role-based internal access controls, and regular security audits. Financial data is processed via PCI-DSS compliant providers.

6. DATA RETENTION
We retain user information only as long as necessary to provide services, comply with legal obligations, resolve disputes, and prevent fraud. When no longer required, data is securely deleted or anonymized.

7. YOUR RIGHTS
You have the right to: access your personal data, correct inaccurate data, request deletion, restrict processing, withdraw consent, or request a copy of your data. To exercise these rights, contact: support@mountescrow.com.

8. CHILDREN'S PRIVACY
Mountescrow is not intended for individuals under 18 years old. We do not knowingly collect data from minors.

9. INTERNATIONAL TRANSFERS
If data is transferred outside your country, we ensure appropriate safeguards are in place to protect your information.

10. CHANGES TO THIS POLICY
We may update this Privacy Policy periodically. Changes will be posted within the app and on our website.

11. CONTACT US
Mountescrow\nEmail: support@mountescrow.com\nWebsite: https://www.mountescrow.com\nAddress: House A2, Basic Estate, Lokogoma, Abuja, Nigeria`,
  },
  "Terms of Service": {
    icon: <Scale className="h-6 w-6" />,
    content: `Effective Date: February 6th, 2026
Company: Mountescrow Limited
Jurisdiction: Federal Republic of Nigeria

1. INTRODUCTION
Welcome to Mountescrow. These Terms of Service ("Terms") govern your access to and use of the Mountescrow website, mobile application, APIs, and related services (collectively, the "Platform"). By registering, accessing, or using Mountescrow, you agree to be bound by these Terms. If you do not agree, you must not use the Platform. Mountescrow Ltd ("Mountescrow", "we", "us", or "our") is a fintech company incorporated under the laws of the Federal Republic of Nigeria. Mountescrow provides secure digital escrow services designed to safeguard transactions between parties. Mountescrow is not a bank and does not provide lending, investment, or financial advisory services. Payment processing is facilitated through licensed financial institutions and regulated payment service providers.

2. OUR ROLE
Mountescrow acts solely as a neutral third-party escrow facilitator. 
We:
• Hold funds in segregated trust or For-Benefit-Of (FBO) accounts
• Release funds when agreed conditions are met
• Provide structured internal dispute facilitation
• Maintain transaction security and compliance systems

We do not:
• Guarantee performance of any buyer or seller
• Act as a party to your contract
• Determine the legality of your underlying agreement
• Provide legal advice
• Guarantee transaction outcomes

The parties to a transaction remain fully responsible for their contractual obligations.

3. ELIGIBILITY
To use Mountescrow, you must:
• Be at least 18 years old
• Have legal capacity to enter binding contracts
• Provide accurate and truthful information
• Complete identity verification (KYC/KYB) requirements
• Comply with applicable laws and regulations
We reserve the right to deny, suspend, or terminate access if eligibility requirements are not met.

4. WHO MAY INITIATE AN ESCROW
Any verified user may initiate an escrow transaction. An escrow may be initiated by a buyer, seller, service provider, client, business entity, or authorized representative. The initiating party must clearly define:
• The escrow amount
• The deliverables or milestones
• The release conditions
• Any relevant timelines
All counterparties must review and accept the escrow terms within the Platform before funds are locked. Mountescrow does not draft, modify, or validate transaction terms and is not responsible for the substance or enforceability of user-created agreements.

5. HOW ESCROW WORKS
5.1 Funding: The Buyer deposits funds into a secure escrow account.
5.2 Holding: Funds are held in segregated accounts managed through licensed financial partners. Escrow funds are not commingled with Mountescrow's operational funds.
5.3 Release Triggers: Funds are released when one of the following occurs: Buyer approval of deliverables, milestone confirmation, mutual written consent, outcome of dispute resolution, or a valid arbitration award.

6. SIX (6) HOUR TRANSACTION EFFICIENCY COUNTDOWN
6.1 Submission of Deliverables: When a Seller or Service Provider submits a deliverable or milestone through the Platform, an automated six (6) hour review countdown is activated.
6.2 Purpose of the Policy: The six-hour review window is implemented to promote transaction efficiency, reduce unnecessary capital lock-up, encourage timely review and communication, and prevent indefinite escrow delays.
6.3 Buyer Review Window: During the six-hour period, the Buyer may approve the submission, triggering immediate release, or formally raise a dispute within the Platform to pause release.
6.4 Automatic Release: If no dispute is raised within the six-hour window, funds are automatically released to the Seller. Each milestone submission activates a new six-hour review window. Users acknowledge that monitoring transaction timelines is their responsibility. Mountescrow is not liable for releases resulting from user inaction within the review window.

7. FEES
Mountescrow may charge escrow service fees (typically 1%–3%), withdrawal or disbursement fees, currency conversion fees, and administrative or dispute handling fees (where applicable). Fees are disclosed prior to transaction confirmation and are generally non-refundable.

8. PROHIBITED ACTIVITIES
You may not use Mountescrow for fraud or misrepresentation, money laundering or terrorism financing, illegal goods or services, Ponzi or pyramid schemes, unlicensed financial services, sanctioned entities or jurisdictions, or abuse of escrow mechanics. Accounts involved in prohibited activities may be suspended immediately and reported to authorities.

9. SECURITY & COMPLIANCE
Mountescrow maintains robust security measures including: encryption of data in transit and at rest, two-factor authentication, transaction monitoring systems, and AML and fraud detection processes. Users are responsible for safeguarding account credentials and reporting suspicious activity.

10. DISPUTE RESOLUTION FRAMEWORK
10.1 Internal Resolution: If a dispute arises, either party may initiate a dispute within the Platform. Escrow funds may be temporarily withheld. Mountescrow may facilitate structured mediation in good faith but does not make judicial determinations.
10.2 Escalation to Independent Mediation & Arbitration: If internal resolution fails, the dispute shall be referred to an independent, reputable mediation and arbitration firm. Proceedings shall be conducted under Nigerian law. Arbitration shall be confidential and binding. The arbitral award shall be final. No party shall initiate court litigation regarding escrow transaction disputes, except for enforcement of an arbitral award.
10.3 Independent Third-Party Verification: Where factual verification is required, an independent expert (licensed professionals, certified auditors, industry-recognized assessors, or subject-matter specialists) may be appointed to assess evidence. Mountescrow is not responsible for the independent conclusions of third-party experts.

11. TERMINATION
Mountescrow may suspend or terminate accounts if these Terms are violated, fraud or illegal activity is suspected, regulatory directives require action, or risk thresholds are exceeded. Termination does not relieve users of outstanding obligations.

12. DATA PROTECTION & PRIVACY
Mountescrow processes data in accordance with Nigerian data protection laws, AML regulations, and applicable international standards. We do not sell user data.

13. LIMITATION OF LIABILITY
Mountescrow's total liability is limited to the fees paid for the relevant transaction. We are not liable for indirect, incidental, or consequential losses. Services are provided "as is" and "as available."

14. GOVERNING LAW
These Terms are governed by the laws of the Federal Republic of Nigeria. Arbitration proceedings shall be seated in Lagos, Nigeria.

15. AMENDMENTS
We may update these Terms periodically. Material changes will be communicated via email, in-app notification, or website notice. Continued use of the Platform constitutes acceptance of updated Terms.

16. CONTACT INFORMATION
Mountescrow Limited\nWebsite: https://www.mountescrow.com\nSupport: support@mountescrow.com`,
  },
  "Refund Policy": {
    icon: <RefreshCcw className="h-6 w-6" />,
    content: `Effective Date: February 6th, 2026

Mountescrow operates as a neutral third-party escrow platform. Funds are handled strictly according to transaction agreements between buyers and sellers.

1. WHEN REFUNDS APPLY
Refunds may be issued when:
• A transaction is canceled by mutual agreement
• The seller fails to deliver agreed goods/services
• A dispute is resolved in favor of the buyer
• Fraudulent activity is confirmed

2. DISPUTE RESOLUTION PROCESS
If a dispute arises, either party may initiate a dispute within the app. Mountescrow reviews submitted evidence from both parties and a decision is made based on transaction terms and provided documentation. Mountescrow acts as a neutral mediator.

3. PROCESSING TIME
Approved refunds are processed within 3–7 business days (bank transfers), subject to payment provider timelines.

4. NON-REFUNDABLE SITUATIONS
Refunds will not be granted when:
• Transaction terms were fulfilled
• Evidence supports seller delivery
• The dispute window has expired

5. FEES
Certain transaction or processing fees may be non-refundable depending on payment provider policies.

6. CONTACT
For refund inquiries: support@mountescrow.com`,
  },
};

// Matches "1. HEADING" or "10. HEADING" (top-level)
const TOP_LEVEL_RE = /^(\d+)\.\s+(.+)$/;
// Matches "5.1 Label:" or "5.1 Label" (sub-level)
const SUB_LEVEL_RE = /^(\d+\.\d+)\s+(.+)$/;
// Matches "A. Label:" or "B. Label" (lettered sub-items)
const LETTER_RE = /^([A-Z])\.\s+(.+)$/;

function PolicyText({ content }) {
  const lines = content.split("\n");

  return (
    <div className="whitespace-pre-line text-gray-700 leading-relaxed text-lg font-headline text-justify">
      {lines.map((line, index) => {
        const topMatch = line.match(TOP_LEVEL_RE);
        const subMatch = !topMatch && line.match(SUB_LEVEL_RE);
        const letterMatch = !topMatch && !subMatch && line.match(LETTER_RE);

        if (topMatch) {
          return (
            <span key={index} className="block mt-8 mb-2">
              <span className="font-bold text-gray-900">
                {topMatch[1]}. {topMatch[2]}
              </span>
            </span>
          );
        }

        if (subMatch) {
          const colonIdx = subMatch[2].indexOf(":");
          if (colonIdx !== -1) {
            const boldPart = subMatch[2].substring(0, colonIdx + 1);
            const normalPart = subMatch[2].substring(colonIdx + 1);
            return (
              <span key={index} className="block mt-4 mb-1">
                <span className="font-bold">
                  {subMatch[1]} {boldPart}
                </span>
                {normalPart}
              </span>
            );
          }
          return (
            <span key={index} className="block mt-4 mb-1">
              <span className="font-bold">
                {subMatch[1]} {subMatch[2]}
              </span>
            </span>
          );
        }

        if (letterMatch) {
          const colonIdx = letterMatch[2].indexOf(":");
          if (colonIdx !== -1) {
            const boldPart = letterMatch[2].substring(0, colonIdx + 1);
            const normalPart = letterMatch[2].substring(colonIdx + 1);
            return (
              <span key={index} className="block mt-3">
                <span className="font-bold">
                  {letterMatch[1]}. {boldPart}
                </span>
                {normalPart}
              </span>
            );
          }
          return (
            <span key={index} className="block mt-3">
              <span className="font-bold">
                {letterMatch[1]}. {letterMatch[2]}
              </span>
            </span>
          );
        }

        // Empty lines get a small gap; regular lines render normally
        if (line.trim() === "") {
          return <span key={index} className="block mt-2" />;
        }

        return (
          <span key={index} className="block mt-1">
            {line}
          </span>
        );
      })}
    </div>
  );
}

export default function DisputeResolutionPage() {
  return (
    <div className="container py-12 md:py-20 bg-gray-50/30 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-5xl mx-auto px-4"
      >
        <div className="text-center mb-12">
          <h1 className="font-headline font-semibold text-4xl md:text-5xl mb-4 text-primary-blue">
            Legal & Compliance
          </h1>
          <p className="text-xl text-secondary-blue max-w-2xl mx-auto">
            Please review the official terms, privacy practices, and refund
            procedures governing our platform.
          </p>
        </div>

        <Tabs defaultValue="Privacy Policy" className="w-full">
          <TabsList className="flex flex-wrap h-auto p-1 font-headline bg-blue-50/50 rounded-xl mb-8 gap-1 justify-center">
            {Object.keys(POLICIES_DATA).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="px-8 py-3 rounded-lg font-semibold data-[state=active]:bg-orange-400 data-[state=active]:text-white transition-all"
              >
                {key}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4">
            {Object.entries(POLICIES_DATA).map(([key, { content, icon }]) => (
              <TabsContent key={key} value={key}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="border-none shadow-xl shadow-blue-900/5 overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 py-8 px-8 md:px-12">
                      <div className="flex items-center gap-4 text-primary-blue">
                        <div className="p-3 bg-blue-50 rounded-lg">{icon}</div>
                        <CardTitle className="font-headline font-bold text-3xl">
                          {key}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 md:p-12 bg-white">
                      <PolicyText content={content} />
                      <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Official Document • Mountescrow Ltd</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </motion.div>
    </div>
  );
}
