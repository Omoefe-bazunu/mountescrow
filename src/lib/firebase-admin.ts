import admin from 'firebase-admin';

// This is the standard and recommended way to initialize the Firebase Admin SDK.
// It will automatically use the credentials from the GOOGLE_APPLICATION_CREDENTIALS
// environment variable if it's set. This works seamlessly in local development
// and in deployed cloud environments like Firebase or Vercel.

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
export { admin, db };
