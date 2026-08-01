import * as SecureStore from 'expo-secure-store';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../config/firebaseConfig';

export interface LogEntry {
  id: string;
  type: 'meal' | 'workout';
  title: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  exerciseType?: string;
  intensity?: 'low' | 'medium' | 'high';
  durationMinutes?: number;
  createdAt: string;
}

export interface DailyLogData {
  date: string; // YYYY-MM-DD
  consumedCalories: number;
  burnedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  consumedWaterLiters: number;
  entries: LogEntry[];
  updatedAt?: any;
}

/**
 * Format a Date object as YYYY-MM-DD
 */
export const formatDateKey = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Helper to safely get local SecureStore key
 */
const getStorageKey = (userId: string, dateStr: string) => `daily_log_${userId}_${dateStr}`;

/**
 * Fetch daily log for a specific user and date (YYYY-MM-DD) from Firestore,
 * falling back to local cache if offline.
 */
export const getDailyLogByDate = async (
  userId: string,
  dateStr: string
): Promise<DailyLogData> => {
  const defaultLog: DailyLogData = {
    date: dateStr,
    consumedCalories: 0,
    burnedCalories: 0,
    consumedProtein: 0,
    consumedCarbs: 0,
    consumedFat: 0,
    consumedWaterLiters: 0,
    entries: [],
  };

  if (!userId || !dateStr) return defaultLog;

  try {
    const logRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
    const logSnap = await getDoc(logRef);

    if (logSnap.exists()) {
      const data = logSnap.data() as DailyLogData;
      const resultLog: DailyLogData = {
        date: dateStr,
        consumedCalories: data.consumedCalories || 0,
        burnedCalories: data.burnedCalories || 0,
        consumedProtein: data.consumedProtein || 0,
        consumedCarbs: data.consumedCarbs || 0,
        consumedFat: data.consumedFat || 0,
        consumedWaterLiters: data.consumedWaterLiters || 0,
        entries: data.entries || [],
      };

      // Cache locally
      if (Platform.OS !== 'web') {
        try {
          await SecureStore.setItemAsync(getStorageKey(userId, dateStr), JSON.stringify(resultLog));
        } catch (storeErr) {
          console.warn('SecureStore save error:', storeErr);
        }
      }

      return resultLog;
    } else {
      // Check local cache if doc doesn't exist on server
      if (Platform.OS !== 'web') {
        try {
          const cached = await SecureStore.getItemAsync(getStorageKey(userId, dateStr));
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (cacheErr) {
          console.warn('SecureStore read error:', cacheErr);
        }
      }
      return defaultLog;
    }
  } catch (error) {
    console.error('❌ [Firebase] Error fetching daily log:', error);
    // Fallback to local cache on error
    if (Platform.OS !== 'web') {
      try {
        const cached = await SecureStore.getItemAsync(getStorageKey(userId, dateStr));
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return defaultLog;
  }
};

/**
 * Add a new meal or workout entry to a specific date's daily log in Firestore.
 */
export const addLogEntryToFirestore = async (
  userId: string,
  dateStr: string,
  entryData: {
    type: 'meal' | 'workout';
    title: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    exerciseType?: string;
    intensity?: 'low' | 'medium' | 'high';
    durationMinutes?: number;
  }
): Promise<DailyLogData> => {
  if (!userId || !dateStr) {
    throw new Error('User ID and date string are required');
  }

  try {
    // 1. Get existing log
    const currentLog = await getDailyLogByDate(userId, dateStr);

    // 2. Create new entry object
    const newEntry: LogEntry = {
      id: Date.now().toString(),
      type: entryData.type,
      title: entryData.title.trim(),
      calories: Number(entryData.calories) || 0,
      protein: Number(entryData.protein) || 0,
      carbs: Number(entryData.carbs) || 0,
      fat: Number(entryData.fat) || 0,
      exerciseType: entryData.exerciseType,
      intensity: entryData.intensity,
      durationMinutes: entryData.durationMinutes,
      createdAt: new Date().toISOString(),
    };

    // 3. Compute updated totals
    const updatedEntries = [newEntry, ...currentLog.entries];

    let newConsumedCalories = currentLog.consumedCalories;
    let newBurnedCalories = currentLog.burnedCalories;
    let newConsumedProtein = currentLog.consumedProtein;
    let newConsumedCarbs = currentLog.consumedCarbs;
    let newConsumedFat = currentLog.consumedFat;

    if (newEntry.type === 'meal') {
      newConsumedCalories += newEntry.calories;
      newConsumedProtein += newEntry.protein || 0;
      newConsumedCarbs += newEntry.carbs || 0;
      newConsumedFat += newEntry.fat || 0;
    } else {
      newBurnedCalories += newEntry.calories;
    }

    const updatedLog: DailyLogData = {
      date: dateStr,
      consumedCalories: newConsumedCalories,
      burnedCalories: newBurnedCalories,
      consumedProtein: newConsumedProtein,
      consumedCarbs: newConsumedCarbs,
      consumedFat: newConsumedFat,
      consumedWaterLiters: currentLog.consumedWaterLiters || 0,
      entries: updatedEntries,
      updatedAt: serverTimestamp(),
    };

    // 4. Save to Firestore
    const logRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
    await setDoc(logRef, updatedLog, { merge: true });

    // 5. Cache locally
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(getStorageKey(userId, dateStr), JSON.stringify({
          ...updatedLog,
          updatedAt: new Date().toISOString(),
        }));
      } catch {}
    }

    console.log(`🔥 [Firebase] Added ${entryData.type} entry to log for ${dateStr}:`, newEntry.title);
    return updatedLog;
  } catch (error) {
    console.error('❌ [Firebase] Error adding log entry:', error);
    throw error;
  }
};

/**
 * Add water log in Liters (default 0.25L = 1 glass of 250ml) to a specific date's log
 */
export const addWaterLogToFirestore = async (
  userId: string,
  dateStr: string,
  addedLiters: number = 0.25
): Promise<DailyLogData> => {
  if (!userId || !dateStr) {
    throw new Error('User ID and date string are required');
  }

  try {
    const currentLog = await getDailyLogByDate(userId, dateStr);
    const updatedWater = Number((currentLog.consumedWaterLiters + addedLiters).toFixed(2));

    const updatedLog: DailyLogData = {
      ...currentLog,
      consumedWaterLiters: updatedWater,
      updatedAt: serverTimestamp(),
    };

    const logRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
    await setDoc(logRef, updatedLog, { merge: true });

    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(getStorageKey(userId, dateStr), JSON.stringify({
          ...updatedLog,
          updatedAt: new Date().toISOString(),
        }));
      } catch {}
    }

    console.log(`💧 [Firebase] Logged +${addedLiters}L water for ${dateStr}. Total: ${updatedWater}L`);
    return updatedLog;
  } catch (error) {
    console.error('❌ [Firebase] Error adding water log entry:', error);
    throw error;
  }
};
