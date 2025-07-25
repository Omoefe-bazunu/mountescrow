// src/lib/firebase-admin.ts
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON env variable is missing");
  }

  let parsedCredentials;
  try {
    parsedCredentials = JSON.parse(serviceAccountJson);
    // Fix escaped newlines in private key (just in case)
    parsedCredentials.private_key = parsedCredentials.private_key?.replace(
      /\\n/g,
      "\n"
    );
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON", error);
    throw error;
  }

  admin.initializeApp({
    credential: admin.credential.cert(parsedCredentials),
  });
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
