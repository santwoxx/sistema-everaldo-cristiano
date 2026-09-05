import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCLdebTg-SdUWjVk24nuHPudVIHFbdwmJI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "valdo-novaes.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "valdo-novaes",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "valdo-novaes.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "946884240436",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:946884240436:web:85cb118ebced2d738f5661",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-B8HVQ1WT6N",
};

// Inicializa o Firebase Singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
