import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserChartIndicatorConfig, Timeframe, CandleDisplayType, PriceScaleMode } from '@/types/chart';

interface ChartState {
  symbol: string;
  timeframe: Timeframe;
  availableConfigs: UserChartIndicatorConfig[];
  isLoading: boolean;
  error: string | null;
  showReferenceLines: boolean;
  candleDisplayType: CandleDisplayType;
  priceScaleMode: PriceScaleMode;
  activeStrategyNo: number | null;
  strategyIndicatorVersion: number;
  viewingVersionNo: number | null;
  autoVersionCounter: number;

  setSymbol: (symbol: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  setAvailableConfigs: (configs: UserChartIndicatorConfig[]) => void;
  updateConfig: (configNo: number, partial: Partial<UserChartIndicatorConfig>) => void;
  addConfig: (config: UserChartIndicatorConfig) => void;
  removeConfig: (configNo: number) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setShowReferenceLines: (show: boolean) => void;
  setCandleDisplayType: (type: CandleDisplayType) => void;
  setPriceScaleMode: (mode: PriceScaleMode) => void;
  setActiveStrategyNo: (no: number | null) => void;
  bumpStrategyIndicatorVersion: () => void;
  setViewingVersionNo: (no: number | null) => void;
  bumpAutoVersionCounter: () => void;
}

export const useChartStore = create<ChartState>()(
  persist(
    (set) => ({
      symbol: 'AAPL',
      timeframe: '1day',
      availableConfigs: [],
      isLoading: false,
      error: null,
      showReferenceLines: true,
      candleDisplayType: 'candles',
      priceScaleMode: 0,
      activeStrategyNo: null,
      strategyIndicatorVersion: 0,
      viewingVersionNo: null,
      autoVersionCounter: 0,

      setSymbol: (symbol) => set({ symbol }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setAvailableConfigs: (configs) => set({ availableConfigs: configs }),
      updateConfig: (configNo, partial) =>
        set((state) => ({
          availableConfigs: state.availableConfigs.map((c) =>
            c.userChartIndicatorConfigNo === configNo ? { ...c, ...partial } : c,
          ),
        })),
      addConfig: (config) =>
        set((state) => ({
          availableConfigs: [...state.availableConfigs, config],
        })),
      removeConfig: (configNo) =>
        set((state) => ({
          availableConfigs: state.availableConfigs.filter(
            (c) => c.userChartIndicatorConfigNo !== configNo,
          ),
        })),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setShowReferenceLines: (showReferenceLines) => set({ showReferenceLines }),
      setCandleDisplayType: (candleDisplayType) => set({ candleDisplayType }),
      setPriceScaleMode: (priceScaleMode) => set({ priceScaleMode }),
      setActiveStrategyNo: (no) => set({ activeStrategyNo: no, availableConfigs: [], viewingVersionNo: null }),
      bumpStrategyIndicatorVersion: () => set((state) => ({ strategyIndicatorVersion: state.strategyIndicatorVersion + 1 })),
      setViewingVersionNo: (no) => set({ viewingVersionNo: no }),
      bumpAutoVersionCounter: () => set((state) => ({ autoVersionCounter: state.autoVersionCounter + 1 })),
    }),
    {
      name: 'qs-chart-view',
      partialize: (state) => ({
        symbol: state.symbol,
        timeframe: state.timeframe,
      }),
    },
  ),
);
