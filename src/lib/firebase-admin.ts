// import admin from "firebase-admin";

// if (!admin.apps.length) {
//   try {
//     const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

//     // IMPORTANT: Replace literal "\\n" with actual newline characters "\n"
//     // This is crucial for environments where "\\n" is stored literally
//     // and not automatically converted to a newline.
//     const privateKeyFormatted = privateKeyRaw
//       ? privateKeyRaw.replace(/\\n/g, "\n")
//       : undefined;

//     const serviceAccount = {
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       privateKey: privateKeyFormatted, // Use the now correctly formatted private key
//     };

//     if (
//       !serviceAccount.projectId ||
//       !serviceAccount.clientEmail ||
//       !serviceAccount.privateKey
//     ) {
//       // This check is good to ensure variables are loaded
//       throw new Error(
//         "Missing one or more Firebase Admin SDK environment variables (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)."
//       );
//     }

//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount),
//     });
//   } catch (error) {
//     console.error("Firebase admin initialization error:", error);
//     // It's crucial to throw the error if initialization fails,
//     // especially in serverless functions (like Next.js API routes)
//     // so the invocation doesn't proceed with an uninitialized Admin SDK.
//     throw error;
//   }
// }

// const db = admin.firestore(); // Or any other admin service you need
// export { admin, db };

import admin from "firebase-admin";

// Parse the private key correctly by replacing escaped newlines
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !privateKey
  ) {
    throw new Error(
      "Missing one or more Firebase Admin SDK environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)."
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    // Uncomment and set your databaseURL if using Realtime Database
    // databaseURL: 'https://your-project-id.firebaseio.com'
  });
}

const db = admin.firestore();

export { admin, db };
