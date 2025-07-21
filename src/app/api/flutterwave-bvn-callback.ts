import type { NextApiRequest, NextApiResponse } from "next";
import { handleBvnConsentCallback } from "@/services/flutterwave.service";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  const { userId, email, firstName, lastName, phone, reference } = req.query;

  // Ensure all required query parameters are present
  if (!userId || !email || !firstName || !lastName || !phone || !reference) {
    console.error(
      "Missing required query parameters for BVN callback:",
      req.query
    );
    // Redirect to an error page or the KYC page with an error message
    return res.redirect("/kyc?status=error&message=Missing callback data");
  }

  try {
    const result = await handleBvnConsentCallback(
      userId as string,
      reference as string,
      {
        email: email as string,
        firstName: firstName as string,
        lastName: lastName as string,
        phone: phone as string,
      }
    );

    if (result.success) {
      // Redirect to the KYC page with a success status
      return res.redirect(
        "/kyc?status=success&message=BVN verification completed"
      );
    } else {
      // Redirect to the KYC page with an error status
      return res.redirect(
        `/kyc?status=error&message=${encodeURIComponent(result.message)}`
      );
    }
  } catch (error: any) {
    console.error("Error handling Flutterwave BVN callback:", error);
    // Redirect to an error page or the KYC page with a generic error
    return res.redirect(
      `/kyc?status=error&message=${encodeURIComponent(
        error.message || "An unexpected error occurred during BVN verification."
      )}`
    );
  }
}
