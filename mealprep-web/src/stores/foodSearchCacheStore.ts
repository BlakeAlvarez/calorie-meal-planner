import { create } from "zustand";

type FoodSearchCacheKey = string;

interface FoodSearchCache {
  cache: Record<FoodSearchCacheKey, any>;
  setCache: (key: string, data: any) => void;
  getCache: (key: string) => any | null;
  clearCache: () => void;
}

export const useFoodSearchCacheStore = create<FoodSearchCache>((set, get) => ({
  cache: {},

  // sets the data in the cache
  setCache: (key, data) =>
    set((state) => ({
      cache: { ...state.cache, [key]: data },
    })),

    // gets data from the cache
  getCache: (key) => get().cache[key] ?? null,
  
  // clears data from the cache
  clearCache: () => set({ cache: {} }),
}));
