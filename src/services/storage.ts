import { Platform } from 'react-native';

export interface KeyValueStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  clearAll(): void;
}

class WebStorage implements KeyValueStorage {
  getString(key: string) {
    try {
      return localStorage.getItem(key) ?? undefined;
    } catch {
      return undefined;
    }
  }
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* noop */
    }
  }
  delete(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  }
  clearAll() {
    try {
      localStorage.clear();
    } catch {
      /* noop */
    }
  }
}

let storage: KeyValueStorage;

if (Platform.OS === 'web') {
  storage = new WebStorage();
} else {
  // MMKV solo existe en builds nativos; este require nunca corre en web
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MMKV } = require('react-native-mmkv');
  const mmkv = new MMKV({ id: 'turniq', encryptionKey: 'turniq-2026' });
  storage = {
    getString: (k: string) => mmkv.getString(k),
    set: (k: string, v: string) => mmkv.set(k, v),
    delete: (k: string) => mmkv.delete(k),
    clearAll: () => mmkv.clearAll(),
  };
}

export { storage };

/** Adaptador para zustand/middleware persist. */
export const zustandStorage = {
  getItem: (key: string): string | null => storage.getString(key) ?? null,
  setItem: (key: string, value: string): void => storage.set(key, value),
  removeItem: (key: string): void => storage.delete(key),
};
