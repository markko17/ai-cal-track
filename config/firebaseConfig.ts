import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const cleanVal = (val?: string) => (val ? val.trim().replace(/^:/, '').replace(/,$/, '') : '');

const firebaseConfig = {
  apiKey: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
// Initialize Firestore
const db = getFirestore(app);

export { app, db };
