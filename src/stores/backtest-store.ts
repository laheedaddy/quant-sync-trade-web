import { create } from 'zustand';
import type { BacktestRun, BacktestTrade, BacktestConditionLog } from '@/types/backtest';
import type { GetUserStrategyVersionDto } from '@/types/strategy';

type ListTab = 'strategy' | 'channels';
type DetailTab = 'backtest' | 'edit' | 'channel';

interface BacktestState {
  selectedStrategyNo: number | null;
  currentRun: BacktestRun | null;
  currentTrades: BacktestTrade[];
  history: BacktestRun[];
  isRunning: boolean;
  isLoadingHistory: boolean;
  panelOpen: boolean;
  versions: GetUserStrategyVersionDto[];
  selectedVersionNo: number | null;
  // Side panel state
  listTab: ListTab;
  detailStrategyNo: number | null;
  detailTab: DetailTab;
  sidePanelWidth: number;

  // Condition debug logs
  conditionLogs: BacktestConditionLog[];
  conditionLogsTotalCount: number;
  conditionLogsPage: number;
  isLoadingConditionLogs: boolean;

  setSelectedStrategyNo: (no: number | null) => void;
  setCurrentRun: (run: BacktestRun | null) => void;
  setCurrentTrades: (trades: BacktestTrade[]) => void;
  setHistory: (runs: BacktestRun[]) => void;
  setIsRunning: (running: boolean) => void;
  setIsLoadingHistory: (loading: boolean) => void;
  setPanelOpen: (open: boolean) => void;
  setVersions: (versions: GetUserStrategyVersionDto[]) => void;
  addVersion: (version: GetUserStrategyVersionDto) => void;
  removeVersion: (versionNo: number) => void;
  setSelectedVersionNo: (no: number | null) => void;
  setListTab: (tab: ListTab) => void;
  setDetailStrategyNo: (no: number | null) => void;
  setDetailTab: (tab: DetailTab) => void;
  setSidePanelWidth: (width: number) => void;
  setConditionLogs: (logs: BacktestConditionLog[]) => void;
  setConditionLogsTotalCount: (count: number) => void;
  setConditionLogsPage: (page: number) => void;
  setIsLoadingConditionLogs: (loading: boolean) => void;
  reset: () => void;
}

export const useBacktestStore = create<BacktestState>((set) => ({
  selectedStrategyNo: null,
  currentRun: null,
  currentTrades: [],
  history: [],
  isRunning: false,
  isLoadingHistory: false,
  panelOpen: true,
  versions: [],
  selectedVersionNo: null,
  listTab: 'strategy',
  detailStrategyNo: null,
  detailTab: 'backtest',
  sidePanelWidth: 400,

  conditionLogs: [],
  conditionLogsTotalCount: 0,
  conditionLogsPage: 1,
  isLoadingConditionLogs: false,

  setSelectedStrategyNo: (selectedStrategyNo) => set({ selectedStrategyNo }),
  setCurrentRun: (currentRun) => set({ currentRun }),
  setCurrentTrades: (currentTrades) => set({ currentTrades }),
  setHistory: (history) => set({ history }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setIsLoadingHistory: (isLoadingHistory) => set({ isLoadingHistory }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setVersions: (versions) => set({ versions }),
  addVersion: (version) => set((state) => ({ versions: [version, ...state.versions] })),
  removeVersion: (versionNo) =>
    set((state) => ({
      versions: state.versions.filter((v) => Number(v.userStrategyVersionNo) !== Number(versionNo)),
    })),
  setSelectedVersionNo: (selectedVersionNo) =>
    set({ selectedVersionNo: selectedVersionNo !== null ? Number(selectedVersionNo) : null }),
  setListTab: (listTab) => set({ listTab }),
  setDetailStrategyNo: (detailStrategyNo) => set({ detailStrategyNo }),
  setDetailTab: (detailTab) => set({ detailTab }),
  setSidePanelWidth: (width) => set({ sidePanelWidth: Math.min(800, Math.max(300, width)) }),
  setConditionLogs: (conditionLogs) => set({ conditionLogs }),
  setConditionLogsTotalCount: (conditionLogsTotalCount) => set({ conditionLogsTotalCount }),
  setConditionLogsPage: (conditionLogsPage) => set({ conditionLogsPage }),
  setIsLoadingConditionLogs: (isLoadingConditionLogs) => set({ isLoadingConditionLogs }),
  reset: () =>
    set({
      selectedStrategyNo: null,
      currentRun: null,
      currentTrades: [],
      history: [],
      isRunning: false,
      isLoadingHistory: false,
      versions: [],
      selectedVersionNo: null,
      listTab: 'strategy',
      detailStrategyNo: null,
      detailTab: 'backtest',
      sidePanelWidth: 400,
      conditionLogs: [],
      conditionLogsTotalCount: 0,
      conditionLogsPage: 1,
      isLoadingConditionLogs: false,
    }),
}));
