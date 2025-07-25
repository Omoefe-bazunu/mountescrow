// src/lib/firebase-admin.ts
import admin from "firebase-admin";

// Only initialize the Firebase Admin SDK once
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
      throw new Error(
        "Firebase credentials not found. Please set the FIREBASE_SERVICE_ACCOUNT_JSON environment variable."
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    serviceAccount.private_key = serviceAccount.private_key.replace(
      /\\n/g,
      "\n"
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("❌ Firebase admin initialization error:", error);
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, auth, db };
