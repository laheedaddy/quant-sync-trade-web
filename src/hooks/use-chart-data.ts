'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const { symbol, timeframe, availableConfigs, activeStrategyNo, strategyIndicatorVersion, viewingVersionNo } = useChartStore();

  const userStrategyNo = activeStrategyNo ?? undefined;

  // Key changes on config add/remove/param-update (NOT isActive toggle).
  // Visibility toggle is handled client-side via activeConfigNos — no refetch needed.
  const activeKey = useMemo(() => {
    if (activeStrategyNo) {
      const versionKey = viewingVersionNo ?? 'live';
      return `strategy:${activeStrategyNo}:v${strategyIndicatorVersion}:ver${versionKey}`;
    }
    return availableConfigs
      .map((c) => `${c.userChartIndicatorConfigNo}:${c.paramHash ?? ''}`)
      .sort()
      .join(',');
  }, [activeStrategyNo, availableConfigs, strategyIndicatorVersion, viewingVersionNo]);

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
        before: isLoadMore ? cursorRef.current : undefined,
        limit: 200,
        userStrategyNo,
        userStrategyVersionNo: viewingVersionNo ?? undefined,
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
      const mock = generateMockData(symbol, timeframe, []);
      setData({
        candles: mock.candles,
        indicators: mock.indicators,
        hasMore: mock.hasMore,
        isLoading: false,
        error: null,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe, activeKey]);

  const loadMore = useCallback(() => {
    if (data.hasMore && !data.isLoading) {
      loadData(true);
    }
  }, [data.hasMore, data.isLoading, loadData]);

  const refetch = useCallback(() => {
    loadData(false);
  }, [loadData]);

  /**
   * 경량 갱신: 최근 10개 캔들만 (인디케이터 생략) → 기존 데이터에 머지
   * 매분 버킷 전환 시 사용 (full refetch 대비 DB 1회 조회, 인디케이터 0회)
   */
  const refreshLatest = useCallback(async () => {
    try {
      const result = await fetchChartData(symbol, {
        timeframe,
        limit: 10,
        candlesOnly: true,
      });

      setData((prev) => ({
        ...prev,
        candles: mergeLatestCandles(prev.candles, result.candles),
        // indicators 유지 — 매분 인디케이터 1~2포인트 차이는 무시
      }));
    } catch {
      // 경량 갱신 실패 시 무시 (다음 틱에서 재시도)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  useEffect(() => {
    cursorRef.current = undefined;
    loadData(false);

    return () => {
      abortRef.current?.abort();
    };
  }, [loadData]);

  return { ...data, loadMore, refetch, refreshLatest };
}

/**
 * 기존 캔들 배열의 꼬리에 최신 캔들을 머지합니다.
 * 겹치는 구간(tradedAt 기준)은 최신 데이터로 교체, 새 캔들은 추가.
 */
function mergeLatestCandles(existing: ChartCandle[], latest: ChartCandle[]): ChartCandle[] {
  if (latest.length === 0) return existing;

  const firstLatestTime = new Date(latest[0].tradedAt).getTime();
  const cutIndex = existing.findIndex(
    (c) => new Date(c.tradedAt).getTime() >= firstLatestTime,
  );

  if (cutIndex === -1) {
    // 모든 기존 캔들이 더 오래됨 → 뒤에 추가
    return [...existing, ...latest];
  }

  return [...existing.slice(0, cutIndex), ...latest];
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
