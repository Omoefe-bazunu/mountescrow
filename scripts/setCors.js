const admin = require("firebase-admin");
const path = require("path");

// 1. Load environment variables from .env.local
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

// 2. Verify required variables
const requiredVars = {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  FIREBASE_STORAGE_BUCKET:
    process.env.FIREBASE_STORAGE_BUCKET ||
    `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
};

// Check for missing variables
const missingVars = Object.entries(requiredVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error("❌ Missing in .env.local:", missingVars.join(", "));
  process.exit(1);
}

// 3. Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: requiredVars.FIREBASE_PROJECT_ID,
    clientEmail: requiredVars.FIREBASE_CLIENT_EMAIL,
    privateKey: requiredVars.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
  storageBucket: requiredVars.FIREBASE_STORAGE_BUCKET,
});

// 4. Configure CORS
async function setCors() {
  try {
    const bucket = admin.storage().bucket();

    // Verify bucket exists
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(
        `Bucket "${requiredVars.FIREBASE_STORAGE_BUCKET}" not found`
      );
    }

    await bucket.setCorsConfiguration([
      {
        origin: ["https://mountescrow.vercel.app", "http://localhost:3000"],
        method: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        responseHeader: ["Content-Type", "Authorization"],
        maxAgeSeconds: 3600,
      },
    ]);

    console.log(
      "✅ CORS updated for bucket:",
      requiredVars.FIREBASE_STORAGE_BUCKET
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("Verify these in Firebase Console:");
    console.log(
      `1. Storage bucket exists: ${requiredVars.FIREBASE_STORAGE_BUCKET}`
    );
    console.log('2. Service account has "Storage Admin" role');
    process.exit(1);
  }
}

setCors();
