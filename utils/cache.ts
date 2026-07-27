import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface TokenCache {
  getToken: (key: string) => Promise<string | null>;
  saveToken: (key: string, value: string) => Promise<void>;
  clearToken?: (key: string) => Promise<void>;
}

const createNativeTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key);
        return item;
      } catch (error) {
        console.error('SecureStore getItem error: ', error);
        await SecureStore.deleteItemAsync(key);
        return null;
      }
    },
    saveToken: async (key: string, value: string) => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('SecureStore setItem error: ', error);
      }
    },
    clearToken: async (key: string) => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('SecureStore deleteItem error: ', error);
      }
    },
  };
};

const createWebTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return localStorage.getItem(key);
        }
        return null;
      } catch (error) {
        console.error('localStorage getItem error: ', error);
        return null;
      }
    },
    saveToken: async (key: string, value: string) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(key, value);
        }
      } catch (error) {
        console.error('localStorage setItem error: ', error);
      }
    },
    clearToken: async (key: string) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('localStorage removeItem error: ', error);
      }
    },
  };
};

export const tokenCache = Platform.OS !== 'web' ? createNativeTokenCache() : createWebTokenCache();

// Helper functions for saving/retrieving user session locally
export const saveUserSession = async (userData: Record<string, any>): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      // On web, only persist non-sensitive session fields to localStorage
      const webSafeData = { id: userData.id, lastActive: userData.lastActive };
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('user_session', JSON.stringify(webSafeData));
      }
    } else {
      // On native, SecureStore is encrypted — safe to store full session
      await SecureStore.setItemAsync('user_session', JSON.stringify(userData));
    }
  } catch (error) {
    console.error('Error saving user session to local storage: ', error);
  }
};

export const getUserSession = async (): Promise<Record<string, any> | null> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        const jsonValue = localStorage.getItem('user_session');
        return jsonValue ? JSON.parse(jsonValue) : null;
      }
      return null;
    } else {
      const jsonValue = await SecureStore.getItemAsync('user_session');
      return jsonValue ? JSON.parse(jsonValue) : null;
    }
  } catch (error) {
    console.error('Error reading user session from local storage: ', error);
    return null;
  }
};

export const clearUserSession = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('user_session');
      }
    } else {
      await SecureStore.deleteItemAsync('user_session');
    }
  } catch (error) {
    console.error('Error clearing user session from local storage: ', error);
  }
};

