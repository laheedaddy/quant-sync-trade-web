'use client';

import { useEffect, useRef } from 'react';
import { useChartStore } from '@/stores/chart-store';
import { useChartData } from '@/hooks/use-chart-data';
import { fetchIndicatorConfigs } from '@/lib/api/chart';
import { ChartSyncManager } from '@/lib/chart/sync';
import { ChartToolbar } from './chart-toolbar';
import { CandlestickChart } from './candlestick-chart';
import { IndicatorPanel } from './indicator-panel';
import { isPanelIndicator } from '@/lib/chart/indicators';
import type { IndicatorConfig } from '@/types/chart';

const DEFAULT_CONFIGS: IndicatorConfig[] = [
  { indicatorConfigNo: 1, indicatorType: 'MA', displayName: 'MA(20)', parameters: { period: 20 }, timeframe: '1day' },
  { indicatorConfigNo: 2, indicatorType: 'EMA', displayName: 'EMA(12)', parameters: { period: 12 }, timeframe: '1day' },
  { indicatorConfigNo: 3, indicatorType: 'RSI', displayName: 'RSI(14)', parameters: { period: 14 }, timeframe: '1day' },
  { indicatorConfigNo: 4, indicatorType: 'MACD', displayName: 'MACD(12,26,9)', parameters: { fast: 12, slow: 26, signal: 9 }, timeframe: '1day' },
  { indicatorConfigNo: 5, indicatorType: 'BOLLINGER', displayName: 'BB(20,2)', parameters: { period: 20, deviation: 2 }, timeframe: '1day' },
  { indicatorConfigNo: 6, indicatorType: 'STOCHASTIC', displayName: 'Stoch(14,3,3)', parameters: { k: 14, d: 3, smooth: 3 }, timeframe: '1day' },
];

export function ChartContainer() {
  const { timeframe, setAvailableConfigs } = useChartStore();
  const { candles, indicators, isLoading, loadMore } = useChartData();
  const syncManagerRef = useRef(new ChartSyncManager());

  // Load indicator configs
  useEffect(() => {
    let cancelled = false;

    async function loadConfigs() {
      try {
        const configs = await fetchIndicatorConfigs(timeframe);
        if (!cancelled) setAvailableConfigs(configs);
      } catch {
        if (!cancelled) setAvailableConfigs(DEFAULT_CONFIGS);
      }
    }

    loadConfigs();
    return () => { cancelled = true; };
  }, [timeframe, setAvailableConfigs]);

  const panelIndicators = indicators.filter((ind) => isPanelIndicator(ind.indicatorType));
  const hasPanels = panelIndicators.length > 0;

  return (
    <div className="flex flex-col h-full bg-[#0a0e17]">
      <ChartToolbar />

      <div className="flex-1 flex flex-col min-h-0">
        {/* Main candlestick chart */}
        <div className={`flex-1 min-h-[300px] ${hasPanels ? '' : ''}`}>
          <CandlestickChart
            candles={candles}
            indicators={indicators}
            isLoading={isLoading}
            onVisibleTimeRangeChange={loadMore}
            syncManager={syncManagerRef.current}
          />
        </div>

        {/* Indicator panels */}
        <IndicatorPanel
          candles={candles}
          indicators={indicators}
          syncManager={syncManagerRef.current}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-[#2a2e39] bg-[#131722]">
        <span className="text-xs font-mono text-[#787b86]">
          {candles.length} candles loaded
        </span>
        {isLoading && (
          <span className="text-xs font-mono text-[#787b86] animate-pulse">
            Loading...
          </span>
        )}
      </div>
    </div>
  );
}
