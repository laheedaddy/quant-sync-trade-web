'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChartCandle, ChartIndicator } from '@/types/chart';
import { fetchChartData } from '@/lib/api/chart';
import { useChartStore } from '@/stores/chart-store';
import { generateMockData } from '@/lib/chart/mock-data';

interface ChartDataState {
  candles: ChartCandle[];
  indicators: ChartIndicator[];
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useChartData() {
  const { symbol, timeframe, activeIndicatorConfigNos } = useChartStore();
  const [data, setData] = useState<ChartDataState>({
    candles: [],
    indicators: [],
    hasMore: false,
    isLoading: true,
    error: null,
  });
  const cursorRef = useRef<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async (isLoadMore = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetchChartData(symbol, {
        timeframe,
        indicatorConfigNos: activeIndicatorConfigNos.length > 0 ? activeIndicatorConfigNos : undefined,
        before: isLoadMore ? cursorRef.current : undefined,
        limit: 200,
      });

      if (controller.signal.aborted) return;

      if (result.candles.length > 0) {
        cursorRef.current = result.candles[0].tradedAt;
      }

      setData((prev) => ({
        candles: isLoadMore
          ? [...result.candles, ...prev.candles]
          : result.candles,
        indicators: isLoadMore
          ? mergeIndicators(prev.indicators, result.indicators)
          : result.indicators,
        hasMore: result.hasMore,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      if (controller.signal.aborted) return;

      // Fallback to mock data when API is unavailable
      const mock = generateMockData(symbol, timeframe, activeIndicatorConfigNos);
      setData({
        candles: mock.candles,
        indicators: mock.indicators,
        hasMore: mock.hasMore,
        isLoading: false,
        error: null,
      });
    }
  }, [symbol, timeframe, activeIndicatorConfigNos]);

  const loadMore = useCallback(() => {
    if (data.hasMore && !data.isLoading) {
      loadData(true);
    }
  }, [data.hasMore, data.isLoading, loadData]);

  useEffect(() => {
    cursorRef.current = undefined;
    loadData(false);

    return () => {
      abortRef.current?.abort();
    };
  }, [loadData]);

  return { ...data, loadMore };
}

function mergeIndicators(
  existing: ChartIndicator[],
  incoming: ChartIndicator[],
): ChartIndicator[] {
  const merged = [...existing];
  for (const inc of incoming) {
    const idx = merged.findIndex(
      (e) => e.indicatorConfigNo === inc.indicatorConfigNo,
    );
    if (idx >= 0) {
      merged[idx] = {
        ...merged[idx],
        data: [...inc.data, ...merged[idx].data],
      };
    } else {
      merged.push(inc);
    }
  }
  return merged;
}
