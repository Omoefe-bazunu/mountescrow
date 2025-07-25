// src/lib/firebase-admin.ts
import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    let cert;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      // Vercel or any prod environment
      cert = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
      // Local dev using .json file
      cert = require("../../firebase-service-account.json");
    }

    admin.initializeApp({
      credential: admin.credential.cert(cert),
    });
  } catch (error) {
    console.error("Firebase Admin initialization error", error);
    throw error;
  }
}

const db = admin.firestore();
export { admin, db };
