
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAF7xAv3FOpOXTfBrPfKihvtTPwkSE3NBs",
  authDomain: "mountescrow-1ac4f.firebaseapp.com",
  projectId: "mountescrow-1ac4f",
  storageBucket: "mountescrow-1ac4f.firebasestorage.app",
  messagingSenderId: "609393830873",
  appId: "1:609393830873:web:6a61f2e6574691fbf3c7c8",
  measurementId: "G-X4NBJLFVBQ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, sendEmailVerification };
