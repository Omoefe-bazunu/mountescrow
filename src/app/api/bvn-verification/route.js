import { NextResponse } from "next/server";

// Handles POST requests to /api/bvn-verification
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { bvn, firstName, lastName, middleName, phone, dob, gender } = body;

    // Validate required fields
    if (!bvn || !firstName || !lastName || !phone || !dob || !gender) {
      console.error("Missing required fields:", {
        bvn,
        firstName,
        lastName,
        phone,
        dob,
        gender,
      });
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch FCMB access token
    const clientId = process.env.FCMB_CLIENT_ID;
    const clientSecret = process.env.FCMB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("FCMB credentials not configured");
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    console.log("Fetching FCMB access token...");
    const tokenResponse = await fetch(
      "https://baas-api.getrova.io/api/services/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: "profile",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token fetch error:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData,
      });
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch access token" },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Make BVN verification request to FCMB's match endpoint
    console.log("Initiating BVN verification for:", {
      bvn,
      firstName,
      lastName,
    });
    const verificationResponse = await fetch(
      "https://baas-api.getrova.io/api/services/bvn-verification/match",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          country: "NG", // Required by FCMB
          idNumber: bvn, // Map bvn to idNumber
          firstName,
          lastName,
          middleName: middleName || undefined,
          phoneNumber: phone, // Map phone to phoneNumber
          dob,
          gender,
        }),
      }
    );

    if (!verificationResponse.ok) {
      const errorData = await verificationResponse.json();
      console.error("BVN verification error:", {
        status: verificationResponse.status,
        statusText: verificationResponse.statusText,
        errorData,
      });
      return NextResponse.json(
        { message: errorData.message || "BVN verification failed" },
        { status: verificationResponse.status }
      );
    }

    const verificationData = await verificationResponse.json();
    console.log("BVN verification successful:", verificationData);

    // Return response matching FCMB's structure
    return NextResponse.json({
      status: verificationData.status,
      data: {
        idType: verificationData.data.idType,
        idNumberVerified: verificationData.data.idNumberVerified,
        namesVerified: verificationData.data.namesVerified,
        dobVerified: verificationData.data.dobVerified,
        genderVerified: verificationData.data.genderVerified,
        phoneNumberVerified: verificationData.data.phoneNumberVerified,
        secondaryIdNumberVerified:
          verificationData.data.secondaryIdNumberVerified,
        verificationStatus: verificationData.data.verificationStatus,
      },
      message: verificationData.message,
    });
  } catch (error) {
    console.error("BVN verification route error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
