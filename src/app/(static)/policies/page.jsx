"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { FilePlus2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAILS = ["raniem57@gmail.com", "mountescrow@gmail.com"];

export default function DisputeResolutionPage() {
  const [policyData, setPolicyData] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { user, csrfToken } = useAuth();

  useEffect(() => {
    // Check if user is admin using JWT token data
    if (user && user.email) {
      setIsAdmin(ADMIN_EMAILS.includes(user.email));
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/policies", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch policies");
      }

      const data = await response.json();
      setPolicyData(data.policies);
    } catch (error) {
      console.error("Failed to fetch policies:", error);
      setError("Failed to load policies. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (policyName, file) => {
    if (!file) return;

    if (!file.type.includes("pdf")) {
      setError("Only PDF files are allowed");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("policyName", policyName);

      const response = await fetch("/api/policies/upload", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload PDF");
      }

      const data = await response.json();

      // Refresh policies to get the new URL
      await fetchPolicies();

      setError(null);
    } catch (error) {
      console.error("Failed to upload PDF:", error);
      setError(error.message || "Failed to upload PDF. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePdf = async (policyName) => {
    if (!confirm("Are you sure you want to delete this policy PDF?")) {
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const response = await fetch(
        `/api/policies/${encodeURIComponent(policyName)}`,
        {
          method: "DELETE",
          headers: {
            "X-CSRF-Token": csrfToken,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete PDF");
      }

      // Refresh policies
      await fetchPolicies();

      setError(null);
    } catch (error) {
      console.error("Failed to delete PDF:", error);
      setError(error.message || "Failed to delete PDF. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setUploading(false);
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
        <h1 className="font-headline font-semibold text-4xl md:text-5xl mb-4 text-primary-blue">
          Policies & Terms
        </h1>
        <p className="lead mb-8 text-secondary-blue">
          Our policies and terms of use are designed to be fair, transparent,
          and efficient.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {uploading && (
          <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-md">
            Processing... Please wait.
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
            defaultValue={Object.keys(policyData)[0] || ""}
            className="w-full text-left"
          >
            <TabsList className="flex flex-col bg-accent-blue h-fit lg:flex-row gap-2 lg:gap-4 justify-center items-center lg:items-stretch">
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
                    className="w-full bg-accent-blue text-white font-semibold text-center"
                  >
                    {key}
                  </TabsTrigger>
                </motion.div>
              ))}
            </TabsList>

            <div className="mt-8 bg-white">
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
                            <CardTitle className="font-headline font-semibold text-2xl text-primary-blue">
                              {key}
                            </CardTitle>
                            {isAdmin && (
                              <div className="flex gap-2">
                                <label
                                  htmlFor={`file-upload-${key}`}
                                  className="cursor-pointer"
                                >
                                  <FilePlus2 className="h-5 w-5 text-primary-blue hover:text-primary-blue/80" />
                                  <input
                                    id={`file-upload-${key}`}
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    disabled={uploading}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileUpload(key, file);
                                      }
                                      // Reset input
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                                {pdfUrl && (
                                  <button
                                    onClick={() => handleDeletePdf(key)}
                                    disabled={uploading}
                                  >
                                    <Trash2 className="h-5 w-5 text-destructive hover:text-destructive/80" />
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
                                className="inline-flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-highlight-blue transition-colors"
                              >
                                View Full {key} PDF
                              </a>
                            </div>
                          ) : (
                            <div className="mt-4 text-gray-500">
                              {isAdmin
                                ? "No PDF uploaded yet. Click the + icon to upload."
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
