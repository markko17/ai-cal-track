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

// Validate required Firebase config values (warn instead of crash)
const REQUIRED_KEYS = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
const missingKeys = REQUIRED_KEYS.filter((key) => !firebaseConfig[key]);
if (missingKeys.length > 0) {
  console.warn(`[Firebase] Missing config keys: ${missingKeys.join(', ')}. Restart Expo server with: npx expo start -c`);
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
// Initialize Firestore
const db = getFirestore(app);

export { app, db };

