// src/lib/firebase-admin.ts
import admin from "firebase-admin";

// Only initialize the Firebase Admin SDK once
if (!admin.apps.length) {
  try {
    // Method 1: Use complete service account JSON (RECOMMENDED for Vercel)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log(
        "✅ Firebase Admin SDK initialized with service account JSON"
      );
    } else {
      // Method 2: Fallback to individual environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
      const clientId = process.env.FIREBASE_CLIENT_ID;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          "Missing Firebase Admin SDK environment variables. Please set either FIREBASE_SERVICE_ACCOUNT_JSON or individual variables."
        );
      }

      // Clean up the private key
      privateKey = privateKey
        .replace(/\\n/g, "\n")
        .replace(/^["']/, "")
        .replace(/["']$/, "")
        .trim();

      // Create service account object
      const serviceAccount = {
        type: "service_account",
        project_id: projectId,
        private_key_id: privateKeyId,
        private_key: privateKey,
        client_email: clientEmail,
        client_id: clientId,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
          clientEmail
        )}`,
        universe_domain: "googleapis.com",
      };

      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount
        ),
      });

      console.log(
        "✅ Firebase Admin SDK initialized with individual variables"
      );
    }
  } catch (error) {
    console.error("❌ Firebase admin initialization error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

const db = admin.firestore();
export { admin, db };
