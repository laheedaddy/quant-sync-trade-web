'use client';

import { useCallback } from 'react';
import { useBacktestStore } from '@/stores/backtest-store';
import { useChartStore } from '@/stores/chart-store';
import {
  runBacktest as apiRunBacktest,
  fetchBacktestRun,
  fetchBacktestHistory,
  deleteBacktestRun,
  fetchConditionLogs,
} from '@/lib/api/backtest';
import { showError } from '@/lib/toast';

export function useBacktest() {
  const store = useBacktestStore();
  const { symbol, timeframe } = useChartStore();

  const run = useCallback(
    async (
      strategyNo: number,
      startDate: string,
      endDate: string,
      initialCapital?: number,
      userStrategyVersionNo?: number,
    ) => {
      store.setIsRunning(true);
      store.setCurrentRun(null);
      store.setCurrentTrades([]);

      try {
        const result = await apiRunBacktest(strategyNo, {
          symbol,
          timeframe,
          startDate,
          endDate,
          initialCapital,
          userStrategyVersionNo,
        });

        store.setCurrentRun(result);

        // trades 포함된 상세 결과 로드
        if (result.backtestRunNo) {
          const detail = await fetchBacktestRun(result.backtestRunNo);
          store.setCurrentRun(detail);
          store.setCurrentTrades(detail.trades || []);
        }

        return result;
      } catch (err) {
        showError(err, '백테스트 실행 실패');
        throw err;
      } finally {
        store.setIsRunning(false);
      }
    },
    [symbol, timeframe],
  );

  const loadHistory = useCallback(async (
    strategyNo: number,
    filters?: { symbol?: string; timeframe?: string },
  ) => {
    store.setIsLoadingHistory(true);
    try {
      const list = await fetchBacktestHistory(strategyNo, filters);
      store.setHistory(list);
    } catch (err) {
      store.setHistory([]);
      showError(err);
    } finally {
      store.setIsLoadingHistory(false);
    }
  }, []);

  const loadRun = useCallback(async (backtestRunNo: number) => {
    try {
      const detail = await fetchBacktestRun(backtestRunNo);
      store.setCurrentRun(detail);
      store.setCurrentTrades(detail.trades || []);
    } catch (err) {
      showError(err);
    }
  }, []);

  const removeRun = useCallback(
    async (backtestRunNo: number) => {
      try {
        await deleteBacktestRun(backtestRunNo);
        store.setHistory(store.history.filter((r) => r.backtestRunNo !== backtestRunNo));
        if (store.currentRun?.backtestRunNo === backtestRunNo) {
          store.setCurrentRun(null);
          store.setCurrentTrades([]);
        }
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [],
  );

  const loadConditionLogs = useCallback(async (backtestRunNo: number, page = 1) => {
    store.setIsLoadingConditionLogs(true);
    try {
      const { logs, totalCount } = await fetchConditionLogs(backtestRunNo, page, 50);
      store.setConditionLogs(logs);
      store.setConditionLogsTotalCount(totalCount);
      store.setConditionLogsPage(page);
    } catch (err) {
      store.setConditionLogs([]);
      store.setConditionLogsTotalCount(0);
      showError(err);
    } finally {
      store.setIsLoadingConditionLogs(false);
    }
  }, []);

  return {
    selectedStrategyNo: store.selectedStrategyNo,
    currentRun: store.currentRun,
    currentTrades: store.currentTrades,
    history: store.history,
    isRunning: store.isRunning,
    isLoadingHistory: store.isLoadingHistory,
    panelOpen: store.panelOpen,
    listTab: store.listTab,
    detailStrategyNo: store.detailStrategyNo,
    detailTab: store.detailTab,
    sidePanelWidth: store.sidePanelWidth,
    setSelectedStrategyNo: store.setSelectedStrategyNo,
    setPanelOpen: store.setPanelOpen,
    setListTab: store.setListTab,
    setDetailStrategyNo: store.setDetailStrategyNo,
    setDetailTab: store.setDetailTab,
    setSidePanelWidth: store.setSidePanelWidth,
    conditionLogs: store.conditionLogs,
    conditionLogsTotalCount: store.conditionLogsTotalCount,
    conditionLogsPage: store.conditionLogsPage,
    isLoadingConditionLogs: store.isLoadingConditionLogs,
    run,
    loadHistory,
    loadRun,
    removeRun,
    loadConditionLogs,
  };
}
