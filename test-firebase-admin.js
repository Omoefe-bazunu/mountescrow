const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin SDK initialized successfully");

  const db = admin.firestore();
  db.collection("users")
    .doc("BOkjGYzcfLfaeF6uWo5WWVdMkEF3")
    .get()
    .then((doc) => {
      if (doc.exists) {
        console.log("User data:", doc.data());
      } else {
        console.log("User not found");
      }
    })
    .catch((error) => {
      console.error("Firestore error:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
    });
} catch (error) {
  console.error("Initialization error:", {
    message: error.message,
    code: error.code,
    stack: error.stack,
  });
}
