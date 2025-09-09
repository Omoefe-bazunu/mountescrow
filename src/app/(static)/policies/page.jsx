"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { FilePlus2, Trash2 } from "lucide-react";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const initialPolicyData = {
  "Refund & Privacy Policy": {
    summary:
      "Mountescrow does not sell or share user data with third parties. We respect your privacy and uphold data protection regulations. We also have a flexible Refund policy that allows for compensation of either parties to a transaction in the event of a dispute. The complete privacy policy and refund policy are available in the PDF document below. Please click to view the full details.",
  },
  "Terms of Use": {
    summary:
      "These Terms of Use govern your use and participation in Mountescrow's services. Below is a summary of key points. For the complete terms and conditions, please refer to the PDF document below.",
  },
};

const ADMIN_EMAILS = ["raniem57@gmail.com", "mountescrow@gmail.com"];

export default function DisputeResolutionPage() {
  const [policyData, setPolicyData] = useState(initialPolicyData);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAdmin(user ? ADMIN_EMAILS.includes(user.email) : false);
    });

    fetchPdfUrls();
    return () => unsubscribe();
  }, []);

  const fetchPdfUrls = async () => {
    setLoading(true);
    try {
      const updatedData = { ...initialPolicyData };

      await Promise.all(
        Object.keys(updatedData).map(async (policy) => {
          const path = `policy-docs/${policy
            .toLowerCase()
            .replace(/\s+/g, "-")}.pdf`;
          try {
            const url =
              (await getDownloadURL(ref(storage, path))) +
              `?alt=media&token=${Date.now()}`;

            updatedData[policy] = { ...updatedData[policy], pdfUrl: url };
          } catch (error) {
            console.log(`PDF not found for ${policy}:`, error);
            updatedData[policy] = { ...updatedData[policy], pdfUrl: undefined };
          }
        })
      );

      setPolicyData(updatedData);
    } catch (error) {
      console.error("Failed to fetch PDFs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (policyName, file) => {
    if (!file) return;

    if (!file.type.includes("pdf")) {
      setError("Only PDF files are allowed");
      return;
    }

    try {
      setLoading(true);
      const path = `policy-docs/${policyName
        .toLowerCase()
        .replace(/\s+/g, "-")}.pdf`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file, {
        cacheControl: "public, max-age=31536000",
      });

      const url = await getDownloadURL(storageRef);

      setPolicyData((prev) => ({
        ...prev,
        [policyName]: { ...prev[policyName], pdfUrl: url },
      }));
    } catch (error) {
      console.error("Failed to upload PDF:", error);
      setError("Failed to upload PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePdf = async (policyName) => {
    try {
      setLoading(true);
      const path = `policy-docs/${policyName
        .toLowerCase()
        .replace(/\s+/g, "-")}.pdf`;
      const storageRef = ref(storage, path);

      await deleteObject(storageRef);

      setPolicyData((prev) => ({
        ...prev,
        [policyName]: { ...prev[policyName], pdfUrl: undefined },
      }));
    } catch (error) {
      console.error("Failed to delete PDF:", error);
      setError("Failed to delete PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto px-4 text-center"
      >
        <h1 className="font-headline font-semibold text-4xl md:text-5xl mb-4 text-primary">
          Policies & Terms
        </h1>
        <p className="lead mb-8 text-muted-foreground">
          Our policies and terms of use are designed to be fair, transparent,
          and efficient.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-2/3 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <div className="grid gap-6 mt-8">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        ) : (
          <Tabs
            defaultValue="Refund & Privacy Policy"
            className="w-full text-left"
          >
            <TabsList className="flex flex-col bg-gray-300 h-fit lg:flex-row gap-2 lg:gap-4 justify-center items-center lg:items-stretch">
              {Object.keys(policyData).map((key, idx) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="w-full lg:w-auto"
                >
                  <TabsTrigger
                    value={key}
                    className="w-full font-semibold text-center"
                  >
                    {key}
                  </TabsTrigger>
                </motion.div>
              ))}
            </TabsList>

            <div className="mt-8">
              {Object.entries(policyData).map(
                ([key, { summary, pdfUrl }], idx) => (
                  <TabsContent key={key} value={key}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: idx * 0.2 }}
                      viewport={{ once: true }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="font-headline font-semibold text-2xl text-primary">
                              {key}
                            </CardTitle>
                            {isAdmin && (
                              <div className="flex gap-2">
                                <label
                                  htmlFor={`file-upload-${key}`}
                                  className="cursor-pointer"
                                >
                                  <FilePlus2 className="h-5 w-5 text-primary" />
                                  <input
                                    id={`file-upload-${key}`}
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) =>
                                      e.target.files?.[0] &&
                                      handleFileUpload(key, e.target.files[0])
                                    }
                                  />
                                </label>
                                {pdfUrl && (
                                  <button onClick={() => handleDeletePdf(key)}>
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="prose max-w-none">
                          <div>{summary}</div>
                          {pdfUrl ? (
                            <div className="mt-6">
                              <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                              >
                                View Full {key} PDF
                              </a>
                            </div>
                          ) : (
                            <div className="mt-4 text-gray-500">
                              {isAdmin
                                ? "No PDF uploaded yet"
                                : "PDF currently unavailable"}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                )
              )}
            </div>
          </Tabs>
        )}
      </motion.div>
    </div>
  );
}
