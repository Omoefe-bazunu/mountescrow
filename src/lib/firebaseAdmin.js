import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Firebase Admin SDK initialization failed:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(
      `Failed to initialize Firebase Admin SDK: ${error.message}`
    );
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
