import * as SecureStore from 'expo-secure-store';
import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
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
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'system' | 'dark' | 'light';
  notifications: boolean;
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

/**
 * Update user primary calorie and macro targets in Firestore and local storage
 */
export const updateUserMacroTargets = async (
  uid: string,
  targets: {
    dailyCalorieGoal: number;
    protein: number;
    carbs: number;
    fat: number;
    waterLiters?: number;
  }
): Promise<void> => {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    const updatePayload: Record<string, any> = {
      dailyCalorieGoal: targets.dailyCalorieGoal,
      macroGoals: {
        protein: targets.protein,
        carbs: targets.carbs,
        fat: targets.fat,
      },
      updatedAt: serverTimestamp(),
    };

    if (targets.waterLiters !== undefined) {
      updatePayload.waterGoal = {
        liters: targets.waterLiters,
        glasses: Math.round(targets.waterLiters * 4),
      };
    }

    await setDoc(userRef, updatePayload, { merge: true });

    // Sync local SecureStore / localStorage
    const existingLocal = await getUserOnboardingFromStorage(uid);
    const updatedLocal = {
      ...(existingLocal || {}),
      dailyCalorieGoal: targets.dailyCalorieGoal,
      macroGoals: {
        protein: targets.protein,
        carbs: targets.carbs,
        fat: targets.fat,
      },
      ...(targets.waterLiters !== undefined
        ? {
            waterGoal: {
              liters: targets.waterLiters,
              glasses: Math.round(targets.waterLiters * 4),
            },
          }
        : {}),
    };
    await saveUserOnboardingToStorage(uid, updatedLocal);

    console.log('✅ [Firebase] User target goals updated in Firestore and local storage:', uid);
  } catch (error) {
    console.error('❌ [Firebase] Error updating user targets:', error);
    throw error;
  }
};

const localDateKey = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Update user weight in Firestore along with the update date.
 * Appends to weightHistory so weight changes over time can be charted.
 */
export const updateUserWeight = async (uid: string, weightKg: number): Promise<void> => {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    const todayKey = localDateKey(new Date());

    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const existingData = userSnap.exists() ? userSnap.data() : {};

      const historyEntry = { weight: weightKg, date: todayKey };
      const existingHistory = Array.isArray(existingData.weightHistory)
        ? existingData.weightHistory
        : [];

      const updatePayload: Record<string, any> = {
        weight: String(weightKg),
        weightUpdatedAt: todayKey,
        weightHistory: [...existingHistory, historyEntry],
        updatedAt: serverTimestamp(),
      };

      transaction.set(userRef, updatePayload, { merge: true });
    });

    console.log('✅ [Firebase] User weight updated in Firestore:', uid);

    // Sync local SecureStore / localStorage so cached profile stays up to date
    const existingLocal = await getUserOnboardingFromStorage(uid);
    const updatedLocal = {
      ...(existingLocal || {}),
      weight: String(weightKg),
    };
    await saveUserOnboardingToStorage(uid, updatedLocal);
  } catch (error) {
    console.error('❌ [Firebase] Error updating user weight:', error);
    throw error;
  }
};

/**
 * Update user preferences (theme, notifications) in Firestore and local storage.
 */
export const updateUserPreferences = async (
  uid: string,
  preferences: UserPreferences
): Promise<void> => {
  if (!uid) throw new Error('User ID is required to update preferences.');
  try {
    const userRef = doc(db, 'users', uid);
    const updatePayload = {
      preferences,
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, updatePayload, { merge: true });

    console.log('✅ [Firebase] User preferences saved to Firestore:', uid, preferences);
  } catch (error) {
    console.error('❌ [Firebase] Error updating user preferences:', error);
    throw error;
  }
};

/**
 * Get user preferences from local storage or Firestore with default fallback values (default light theme).
 */
export const getUserPreferences = async (uid: string): Promise<UserPreferences> => {
  const defaultPrefs: UserPreferences = {
    theme: 'light',
    notifications: true,
  };

  if (!uid) return defaultPrefs;

  try {
    const dbRes = await getUserFromFirestore(uid);
    if (dbRes.exists && dbRes.data?.preferences) {
      return {
        theme: dbRes.data.preferences.theme || 'light',
        notifications: dbRes.data.preferences.notifications ?? true,
      };
    }

    const localData = await getUserOnboardingFromStorage(uid);
    if (localData?.preferences) {
      return {
        theme: localData.preferences.theme || 'light',
        notifications: localData.preferences.notifications ?? true,
      };
    }

    return defaultPrefs;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return defaultPrefs;
  }
};





