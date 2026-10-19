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

// AsyncStorage es asíncrono; lo adaptamos a la interfaz síncrona con caché en memoria.
class AsyncStorageAdapter implements KeyValueStorage {
  private cache = new Map<string, string>();
  private loaded = false;
  private AsyncStorage: any = null;

  private ensure() {
    if (!this.AsyncStorage) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      this.AsyncStorage = require('@react-native-async-storage/async-storage').default;
      this.AsyncStorage.getAllKeys().then((keys: string[]) => {
        if (!keys.length) {
          this.loaded = true;
          return;
        }
        this.AsyncStorage.multiGet(keys).then((pairs: [string, string | null][]) => {
          for (const [k, v] of pairs) if (v != null) this.cache.set(k, v);
          this.loaded = true;
        });
      });
    }
  }

  getString(key: string) {
    this.ensure();
    return this.cache.get(key);
  }
  set(key: string, value: string) {
    this.ensure();
    this.cache.set(key, value);
    this.AsyncStorage?.setItem(key, value).catch(() => {});
  }
  delete(key: string) {
    this.ensure();
    this.cache.delete(key);
    this.AsyncStorage?.removeItem(key).catch(() => {});
  }
  clearAll() {
    this.ensure();
    this.cache.clear();
    this.AsyncStorage?.clear().catch(() => {});
  }
}

let storage: KeyValueStorage;

if (Platform.OS === 'web') {
  storage = new WebStorage();
} else {
  storage = new AsyncStorageAdapter();
}

export { storage };

/** Adaptador para zustand/middleware persist. */
export const zustandStorage = {
  getItem: (key: string): string | null => storage.getString(key) ?? null,
  setItem: (key: string, value: string): void => storage.set(key, value),
  removeItem: (key: string): void => storage.delete(key),
};
