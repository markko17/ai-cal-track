import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface LogEntry {
  id: string;
  type: 'meal' | 'workout';
  title: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize?: string;
  foodIcon?: string;
  imageUrl?: string;
  exerciseType?: string;
  intensity?: 'low' | 'medium' | 'high';
  durationMinutes?: number;
  createdAt: string;
}

export interface DailyLogData {
  date: string;
  consumedCalories: number;
  burnedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  consumedWaterLiters: number;
  entries: LogEntry[];
  updatedAt?: any;
}

export const formatDateKey = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getStorageKey = (userId: string, dateStr: string) => `daily_log_${userId}_${dateStr}`;
const defaultLog = (date: string): DailyLogData => ({ date, consumedCalories: 0, burnedCalories: 0, consumedProtein: 0, consumedCarbs: 0, consumedFat: 0, consumedWaterLiters: 0, entries: [] });
const normalize = (date: string, data?: Partial<DailyLogData>): DailyLogData => ({ ...defaultLog(date), ...data, entries: data?.entries || [] });
const cacheLog = async (userId: string, date: string, log: DailyLogData) => {
  try { await AsyncStorage.setItem(getStorageKey(userId, date), JSON.stringify({ ...log, updatedAt: new Date().toISOString() })); } catch (error) { console.warn('Daily log cache save error:', error); }
};
const readCachedLog = async (userId: string, date: string) => {
  try { const cached = await AsyncStorage.getItem(getStorageKey(userId, date)); return cached ? normalize(date, JSON.parse(cached)) : null; } catch (error) { console.warn('Daily log cache read error:', error); return null; }
};

export const getDailyLogByDate = async (userId: string, dateStr: string): Promise<DailyLogData> => {
  const fallback = defaultLog(dateStr);
  if (!userId || !dateStr) return fallback;
  try {
    const snapshot = await getDoc(doc(db, 'users', userId, 'dailyLogs', dateStr));
    if (!snapshot.exists()) return (await readCachedLog(userId, dateStr)) || fallback;
    const result = normalize(dateStr, snapshot.data() as Partial<DailyLogData>);
    await cacheLog(userId, dateStr, result);
    return result;
  } catch (error) {
    console.error('Daily log fetch error:', error);
    return (await readCachedLog(userId, dateStr)) || fallback;
  }
};

export const addLogEntryToFirestore = async (userId: string, dateStr: string, entryData: Omit<LogEntry, 'id' | 'createdAt'>): Promise<DailyLogData> => {
  if (!userId || !dateStr) throw new Error('User ID and date string are required');
  const logRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
  try {
    const updated = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(logRef);
      const current = normalize(dateStr, snapshot.exists() ? snapshot.data() as Partial<DailyLogData> : undefined);
      const entry: LogEntry = { ...entryData, id: doc(collection(db, '_')).id, title: entryData.title.trim(), calories: Number(entryData.calories) || 0, protein: Number(entryData.protein) || 0, carbs: Number(entryData.carbs) || 0, fat: Number(entryData.fat) || 0, createdAt: new Date().toISOString() };
      const next: DailyLogData = {
        ...current,
        entries: [entry, ...current.entries],
        consumedCalories: current.consumedCalories + (entry.type === 'meal' ? entry.calories : 0),
        burnedCalories: current.burnedCalories + (entry.type === 'workout' ? entry.calories : 0),
        consumedProtein: Number((current.consumedProtein + (entry.type === 'meal' ? entry.protein || 0 : 0)).toFixed(2)),
        consumedCarbs: Number((current.consumedCarbs + (entry.type === 'meal' ? entry.carbs || 0 : 0)).toFixed(2)),
        consumedFat: Number((current.consumedFat + (entry.type === 'meal' ? entry.fat || 0 : 0)).toFixed(2)),
        updatedAt: serverTimestamp(),
      };
      transaction.set(logRef, next, { merge: true });
      return next;
    });
    await cacheLog(userId, dateStr, updated);
    return updated;
  } catch (error) { console.error('Daily log write error:', error); throw error; }
};

export const addWaterLogToFirestore = async (userId: string, dateStr: string, addedLiters = 0.25): Promise<DailyLogData> => {
  if (!userId || !dateStr) throw new Error('User ID and date string are required');
  const logRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
  try {
    const updated = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(logRef);
      const current = normalize(dateStr, snapshot.exists() ? snapshot.data() as Partial<DailyLogData> : undefined);
      const next: DailyLogData = { ...current, consumedWaterLiters: Number((current.consumedWaterLiters + addedLiters).toFixed(2)), updatedAt: serverTimestamp() };
      transaction.set(logRef, next, { merge: true });
      return next;
    });
    await cacheLog(userId, dateStr, updated);
    return updated;
  } catch (error) { console.error('Water log write error:', error); throw error; }
};
