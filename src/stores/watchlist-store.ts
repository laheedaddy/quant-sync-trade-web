import { create } from 'zustand';
import type { WatchlistGroup, WatchlistItem } from '@/types/watchlist';

interface WatchlistState {
  groups: WatchlistGroup[];
  isLoading: boolean;
  setGroups: (groups: WatchlistGroup[]) => void;
  setIsLoading: (loading: boolean) => void;
  addGroup: (group: WatchlistGroup) => void;
  updateGroup: (groupNo: number, updates: Partial<WatchlistGroup>) => void;
  removeGroup: (groupNo: number) => void;
  addItem: (groupNo: number, item: WatchlistItem) => void;
  removeItem: (groupNo: number, itemNo: number) => void;
  moveItem: (fromGroupNo: number, toGroupNo: number, itemNo: number) => void;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  groups: [],
  isLoading: false,

  setGroups: (groups) => set({ groups }),
  setIsLoading: (isLoading) => set({ isLoading }),

  addGroup: (group) =>
    set((state) => ({ groups: [...state.groups, group] })),

  updateGroup: (groupNo, updates) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.userWatchlistGroupNo === groupNo ? { ...g, ...updates } : g,
      ),
    })),

  removeGroup: (groupNo) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.userWatchlistGroupNo !== groupNo),
    })),

  addItem: (groupNo, item) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.userWatchlistGroupNo === groupNo
          ? { ...g, items: [...g.items, item] }
          : g,
      ),
    })),

  removeItem: (groupNo, itemNo) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.userWatchlistGroupNo === groupNo
          ? { ...g, items: g.items.filter((i) => i.userWatchlistItemNo !== itemNo) }
          : g,
      ),
    })),

  moveItem: (fromGroupNo, toGroupNo, itemNo) =>
    set((state) => {
      const fromGroup = state.groups.find((g) => g.userWatchlistGroupNo === fromGroupNo);
      const item = fromGroup?.items.find((i) => i.userWatchlistItemNo === itemNo);
      if (!item) return state;
      return {
        groups: state.groups.map((g) => {
          if (g.userWatchlistGroupNo === fromGroupNo) {
            return { ...g, items: g.items.filter((i) => i.userWatchlistItemNo !== itemNo) };
          }
          if (g.userWatchlistGroupNo === toGroupNo) {
            return { ...g, items: [...g.items, item] };
          }
          return g;
        }),
      };
    }),
}));
