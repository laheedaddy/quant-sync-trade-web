import { create } from 'zustand';
import type { GetUserStrategyDto } from '@/types/strategy';

interface StrategyListState {
  strategies: GetUserStrategyDto[];
  isLoading: boolean;
  error: string | null;

  setStrategies: (list: GetUserStrategyDto[]) => void;
  addStrategy: (s: GetUserStrategyDto) => void;
  updateStrategy: (userStrategyNo: number, partial: Partial<GetUserStrategyDto>) => void;
  removeStrategy: (userStrategyNo: number) => void;
  setIsLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useStrategyStore = create<StrategyListState>((set) => ({
  strategies: [],
  isLoading: false,
  error: null,

  setStrategies: (strategies) => set({ strategies }),
  addStrategy: (s) =>
    set((state) => ({ strategies: [...state.strategies, s] })),
  updateStrategy: (userStrategyNo, partial) =>
    set((state) => ({
      strategies: state.strategies.map((s) =>
        s.userStrategyNo === userStrategyNo ? { ...s, ...partial } : s,
      ),
    })),
  removeStrategy: (userStrategyNo) =>
    set((state) => ({
      strategies: state.strategies.filter((s) => s.userStrategyNo !== userStrategyNo),
    })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
