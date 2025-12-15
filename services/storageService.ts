
import { encryptData, decryptData } from './cryptoUtils';

// This Service Abstraction Layer allows us to easily swap localStorage 
// for a real backend (Firebase/Supabase) in the future without changing UI code.

export const StorageService = {
  async save<T>(key: string, data: T, isSensitive: boolean = false): Promise<void> {
    try {
      if (isSensitive) {
        const encrypted = await encryptData(data);
        localStorage.setItem(key, encrypted);
      } else {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (e) {
      console.error(`Failed to save ${key}`, e);
    }
  },

  async load<T>(key: string, defaultValue: T, isSensitive: boolean = false): Promise<T> {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      if (isSensitive) {
        const decrypted = await decryptData<T>(item);
        return decrypted !== null ? decrypted : defaultValue;
      } else {
        return JSON.parse(item) as T;
      }
    } catch (e) {
      console.error(`Failed to load ${key}`, e);
      return defaultValue;
    }
  },

  async clear(): Promise<void> {
    localStorage.clear();
  }
};
