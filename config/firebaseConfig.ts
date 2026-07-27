import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Trim whitespace only — .env values should already be clean
const cleanVal = (val?: string) => val?.trim() ?? '';

const firebaseConfig = {
  apiKey: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanVal(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
};

// Validate all required Firebase config values are present
const REQUIRED_KEYS = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
for (const key of REQUIRED_KEYS) {
  if (!firebaseConfig[key]) {
    throw new Error(`[Firebase] Missing required config value: ${key}. Check your .env file.`);
  }
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
// Initialize Firestore
const db = getFirestore(app);

export { app, db };

