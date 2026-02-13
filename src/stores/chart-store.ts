import { create } from 'zustand';
import type { IndicatorConfig, Timeframe } from '@/types/chart';

interface ChartState {
  symbol: string;
  timeframe: Timeframe;
  availableConfigs: IndicatorConfig[];
  activeIndicatorConfigNos: number[];
  isLoading: boolean;
  error: string | null;

  setSymbol: (symbol: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  toggleIndicator: (configNo: number) => void;
  setAvailableConfigs: (configs: IndicatorConfig[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChartStore = create<ChartState>((set) => ({
  symbol: 'AAPL',
  timeframe: '1day',
  availableConfigs: [],
  activeIndicatorConfigNos: [],
  isLoading: false,
  error: null,

  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  toggleIndicator: (configNo) =>
    set((state) => ({
      activeIndicatorConfigNos: state.activeIndicatorConfigNos.includes(configNo)
        ? state.activeIndicatorConfigNos.filter((n) => n !== configNo)
        : [...state.activeIndicatorConfigNos, configNo],
    })),
  setAvailableConfigs: (configs) => set({ availableConfigs: configs }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
