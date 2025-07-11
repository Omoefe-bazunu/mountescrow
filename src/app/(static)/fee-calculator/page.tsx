"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FeesBreakdown from "@/components/fees/FeesBreakdown";
import FaqSection from "@/components/home/FaqSection";

export default function FeeCalculatorPage() {
  return (
    <>
      <div className="bg-muted/40 font-body">
        <div className="container max-w-screen-xl mx-auto px-4 md:px-8 py-16 ">
          <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-md">
            <h1 className="font-headline text-3xl md:text-4xl text-primary mb-4">
              Calculate Your Escrow Fee
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Calculate the exact amount we are charging for helping you hold
              your funds until your transaction is completed.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">
                  Amount to hold
                </Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="E.g. 2,000.00"
                    defaultValue="2000.00"
                  />
                  <Select defaultValue="ngn">
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ngn">NGN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Calculate
              </Button>
            </div>
          </div>
        </div>
      </div>
      <FeesBreakdown />
      <FaqSection />
    </>
  );
}
