import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

interface DeveloperState {
  apiKeys: ApiKey[];
  generateKey: (name: string) => void;
  revokeKey: (id: string) => void;
}

export const useDeveloperStore = create<DeveloperState>()(
  persist(
    (set) => ({
      apiKeys: [],

      generateKey: (name) => {
        const prefix = 'sk_live_';
        const random =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        const newKey: ApiKey = {
          id: Math.random().toString(36).substring(2, 9),
          key: `${prefix}${random}`,
          name,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ apiKeys: [...state.apiKeys, newKey] }));
      },

      revokeKey: (id) => {
        set((state) => ({ apiKeys: state.apiKeys.filter((k) => k.id !== id) }));
      },
    }),
    { name: 'klyb-admin-developer-storage' }
  )
);
