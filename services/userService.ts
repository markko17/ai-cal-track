import * as SecureStore from 'expo-secure-store';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../config/firebaseConfig';

export interface UserProfileData {
  uid: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  authProvider?: string;
  gender?: string;
  goal?: string;
  workoutDays?: string;
  birthdate?: { day: string; month: string; year: string } | string;
  height?: string;
  weight?: string;
  dailyCalorieGoal?: number;
  macroGoals?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  waterGoal?: {
    liters: number;
    glasses: number;
  };
  bmi?: number;
  bmiCategory?: string;
  targetWeightPace?: string;
  fitnessAdvice?: string;
  onboardingCompleted?: boolean;
}

/**
 * Saves user basic information in Firebase Firestore database if it does not already exist.
 * If user already exists in Firebase, syncs missing fields without overwriting user data.
 */
export const saveUserToFirestore = async (userData: UserProfileData) => {
  if (!userData?.uid) return;

  try {
    const userRef = doc(db, 'users', userData.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // User does not exist in Firebase -> Create new user document
      const newUserPayload = {
        uid: userData.uid,
        email: userData.email || '',
        fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Fitness Enthusiast',
        imageUrl: userData.imageUrl || '',
        authProvider: userData.authProvider || 'clerk',
        dailyCalorieGoal: 2000,
        macroGoals: {
          protein: 150,
          carbs: 200,
          fat: 65,
        },
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, newUserPayload);
      console.log('🔥 [Firebase] New user information saved to Firestore:', userData.uid);
      return { status: 'created', data: newUserPayload };
    } else {
      // User already exists in Firebase -> Sync updated/missing fields
      const existingData = userSnap.data();
      const updates: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };

      if (userData.email && !existingData.email) updates.email = userData.email;
      if (userData.fullName && !existingData.fullName) updates.fullName = userData.fullName;
      if (userData.imageUrl && !existingData.imageUrl) updates.imageUrl = userData.imageUrl;

      await setDoc(userRef, updates, { merge: true });
      console.log('🔥 [Firebase] User information already exists in Firestore:', userData.uid);
      return { status: 'exists', data: existingData };
    }
  } catch (error) {
    console.error('❌ [Firebase] Error saving user profile to Firestore:', error);
    throw error;
  }
};

export interface FirestoreUserResult {
  exists: boolean;
  data: Record<string, any> | null;
  error?: any;
}

/**
 * Get user document from Firestore distinctly distinguishing missing records from errors
 */
export const getUserFromFirestore = async (uid: string): Promise<FirestoreUserResult> => {
  if (!uid) return { exists: false, data: null };
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { exists: true, data: userSnap.data() };
    }
    return { exists: false, data: null };
  } catch (error) {
    console.error('❌ [Firebase] Error getting user profile from Firestore:', error);
    return { exists: false, data: null, error };
  }
};

/**
 * Update user onboarding information in Firestore
 */
export const updateUserOnboarding = async (uid: string, onboardingData: Record<string, any>): Promise<void> => {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        ...onboardingData,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log('✅ [Firebase] User onboarding saved to Firestore:', uid);
  } catch (error) {
    console.error('❌ [Firebase] Error updating user onboarding in Firestore:', error);
    throw error;
  }
};

/**
 * Save user onboarding details locally to SecureStore / localStorage
 */
export const saveUserOnboardingToStorage = async (uid: string, data: Record<string, any>): Promise<void> => {
  try {
    const key = `user_onboarding_${uid}`;
    const payload = JSON.stringify({ ...data, onboardingCompleted: true });
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, payload);
      }
    } else {
      await SecureStore.setItemAsync(key, payload);
    }
  } catch (error) {
    console.error('Error saving onboarding data to storage:', error);
    throw error;
  }
};


/**
 * Get user onboarding details from SecureStore / localStorage
 */
export const getUserOnboardingFromStorage = async (uid: string): Promise<Record<string, any> | null> => {
  try {
    const key = `user_onboarding_${uid}`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
      }
      return null;
    } else {
      const val = await SecureStore.getItemAsync(key);
      return val ? JSON.parse(val) : null;
    }
  } catch (error) {
    console.error('Error reading onboarding data from storage:', error);
    return null;
  }
};



