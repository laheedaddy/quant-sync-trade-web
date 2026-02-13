import { create } from 'zustand';
import type {
  GetUserStrategyDto,
  GetUserIndicatorConfigDto,
  GetUserSignalRuleDto,
} from '@/types/strategy';

interface StrategyDetailState {
  strategy: GetUserStrategyDto | null;
  indicators: GetUserIndicatorConfigDto[];
  rules: GetUserSignalRuleDto[];
  isLoading: boolean;
  error: string | null;

  setStrategy: (s: GetUserStrategyDto | null) => void;
  setIndicators: (list: GetUserIndicatorConfigDto[]) => void;
  setRules: (list: GetUserSignalRuleDto[]) => void;
  setIsLoading: (v: boolean) => void;
  setError: (e: string | null) => void;

  addIndicator: (ind: GetUserIndicatorConfigDto) => void;
  updateIndicator: (no: number, ind: GetUserIndicatorConfigDto) => void;
  removeIndicator: (no: number) => void;

  addRule: (rule: GetUserSignalRuleDto) => void;
  updateRule: (no: number, rule: GetUserSignalRuleDto) => void;
  removeRule: (no: number) => void;
}

export const useStrategyDetailStore = create<StrategyDetailState>((set) => ({
  strategy: null,
  indicators: [],
  rules: [],
  isLoading: false,
  error: null,

  setStrategy: (strategy) => set({ strategy }),
  setIndicators: (indicators) => set({ indicators }),
  setRules: (rules) => set({ rules }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addIndicator: (ind) =>
    set((state) => ({ indicators: [...state.indicators, ind] })),
  updateIndicator: (no, ind) =>
    set((state) => ({
      indicators: state.indicators.map((i) =>
        i.userIndicatorConfigNo === no ? ind : i,
      ),
    })),
  removeIndicator: (no) =>
    set((state) => ({
      indicators: state.indicators.filter((i) => i.userIndicatorConfigNo !== no),
    })),

  addRule: (rule) =>
    set((state) => ({ rules: [...state.rules, rule] })),
  updateRule: (no, rule) =>
    set((state) => ({
      rules: state.rules.map((r) =>
        r.userSignalRuleNo === no ? rule : r,
      ),
    })),
  removeRule: (no) =>
    set((state) => ({
      rules: state.rules.filter((r) => r.userSignalRuleNo !== no),
    })),
}));
