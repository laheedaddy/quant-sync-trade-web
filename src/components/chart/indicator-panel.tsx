'use client';

import { useRef, useEffect, useMemo } from 'react';
import {
  createChart,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type LineWidth,
} from 'lightweight-charts';
import type { ChartCandle, ChartIndicator, IndicatorType } from '@/types/chart';
import type { ChartSyncManager } from '@/lib/chart/sync';
import { useChartStore } from '@/stores/chart-store';
import { createPanelChartTheme, INDICATOR_COLORS } from '@/lib/chart/theme';
import { getIndicatorSeriesConfig, isPanelIndicator } from '@/lib/chart/indicators';
import {
  transformIndicatorLine,
  transformIndicatorHistogram,
  getCandleTimestamps,
  padWithWhitespace,
} from '@/lib/chart/utils';
import { formatPrice } from '@/lib/utils/format';
import { Eye, EyeOff, Settings, X } from 'lucide-react';
import type { UTCTimestamp } from 'lightweight-charts';

interface IndicatorActions {
  onEdit: (configNo: number) => void;
  onToggle: (configNo: number) => void;
  onDelete: (configNo: number) => void;
}

interface IndicatorPanelProps {
  candles: ChartCandle[];
  indicators: ChartIndicator[];
  syncManager?: ChartSyncManager;
  indicatorActions?: IndicatorActions;
  activeConfigNos?: number[];
}

export function IndicatorPanel({ candles, indicators, syncManager, indicatorActions, activeConfigNos }: IndicatorPanelProps) {
  const { timeframe } = useChartStore();
  const panelIndicators = indicators.filter((ind) => isPanelIndicator(ind.indicatorType));
  const candleTimestamps = useMemo(() => getCandleTimestamps(candles, timeframe), [candles, timeframe]);

  if (panelIndicators.length === 0) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {panelIndicators.map((indicator) => (
        <SingleIndicatorPanel
          key={indicator.indicatorConfigNo}
          indicator={indicator}
          candleTimestamps={candleTimestamps}
          syncManager={syncManager}
          indicatorActions={indicatorActions}
          isActive={activeConfigNos?.includes(indicator.indicatorConfigNo) ?? true}
        />
      ))}
    </div>
  );
}

interface SingleIndicatorPanelProps {
  indicator: ChartIndicator;
  candleTimestamps: UTCTimestamp[];
  syncManager?: ChartSyncManager;
  indicatorActions?: IndicatorActions;
  isActive: boolean;
}

function SingleIndicatorPanel({ indicator, candleTimestamps, syncManager, indicatorActions, isActive }: SingleIndicatorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map());
  const { showReferenceLines, timeframe } = useChartStore();

  const config = getIndicatorSeriesConfig(indicator.indicatorType as IndicatorType);

  // Create chart
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      ...createPanelChartTheme(),
      width: container.clientWidth,
      height: container.clientHeight,
      autoSize: true,
    });

    chartRef.current = chart;

    const unregisterSync = syncManager?.register(chart);

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    });
    resizeObserver.observe(container);

    return () => {
      unregisterSync?.();
      resizeObserver.disconnect();
      seriesRef.current.clear();
      chart.remove();
      chartRef.current = null;
    };
  }, [syncManager]);

  // Update data
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || indicator.data.length === 0) return;

    // Clear existing series
    for (const [, series] of seriesRef.current) {
      chart.removeSeries(series);
    }
    seriesRef.current.clear();

    for (const seriesConfig of config.series) {
      if (seriesConfig.seriesType === 'line') {
        const series = chart.addSeries(LineSeries, {
          color: seriesConfig.color,
          lineWidth: (seriesConfig.lineWidth ?? 1) as LineWidth,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        const data = transformIndicatorLine(indicator.data, seriesConfig.key, timeframe);
        const paddedData = padWithWhitespace(data, candleTimestamps);
        if (paddedData.length > 0) series.setData(paddedData);
        seriesRef.current.set(seriesConfig.key, series);
      } else if (seriesConfig.seriesType === 'histogram') {
        const series = chart.addSeries(HistogramSeries, {
          priceScaleId: seriesConfig.priceScaleId,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        const data = transformIndicatorHistogram(
          indicator.data,
          seriesConfig.key,
          INDICATOR_COLORS.MACD_HISTOGRAM_POSITIVE,
          INDICATOR_COLORS.MACD_HISTOGRAM_NEGATIVE,
          timeframe,
        );
        const paddedData = padWithWhitespace(data, candleTimestamps);
        if (paddedData.length > 0) series.setData(paddedData);
        seriesRef.current.set(seriesConfig.key, series);
      }
    }

    // Add reference lines (overbought/oversold)
    if (showReferenceLines && config.referenceLines) {
      for (const refLine of config.referenceLines) {
        const firstLineSeries = Array.from(seriesRef.current.values())[0];
        if (firstLineSeries) {
          firstLineSeries.createPriceLine({
            price: refLine.value,
            color: refLine.color,
            lineWidth: 1 as LineWidth,
            lineStyle: 2,
            axisLabelVisible: false,
            title: refLine.label,
          });
        }
      }
    }

    // Sync to main chart's current visible range
    syncManager?.applyCurrentRange(chart);
  }, [indicator, config, candleTimestamps, syncManager, showReferenceLines]);

  const lastData = indicator.data[indicator.data.length - 1];

  return (
    <div className="relative border-t border-[#1e222d] flex-1 min-h-0">
      <div className="absolute top-1 left-2 z-10 flex items-center gap-2 pointer-events-none">
        {/* 이름: 호버 영역 (pointer-events-auto) */}
        <div className="group/panel-label flex items-center gap-1 pointer-events-auto">
          <span className="text-xs font-mono font-semibold text-[#787b86] cursor-default">
            {indicator.displayName}
          </span>

          {/* 액션 버튼 - opacity 기반 (레이아웃 변경 없음) */}
          {indicatorActions && (
            <div className="flex items-center gap-0 opacity-0 group-hover/panel-label:opacity-100 transition-opacity duration-150">
              <button
                onClick={() => indicatorActions.onEdit(indicator.indicatorConfigNo)}
                className="p-0.5 text-[#787b86] hover:text-[#d1d4dc] transition-colors"
                title="Settings"
              >
                <Settings className="w-3 h-3" />
              </button>
              <button
                onClick={() => indicatorActions.onToggle(indicator.indicatorConfigNo)}
                className="p-0.5 text-[#787b86] hover:text-[#d1d4dc] transition-colors"
                title={isActive ? 'Hide' : 'Show'}
              >
                {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
              <button
                onClick={() => indicatorActions.onDelete(indicator.indicatorConfigNo)}
                className="p-0.5 text-[#787b86] hover:text-[#ef5350] transition-colors"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {lastData && (
          <span className="text-xs font-mono text-[#d1d4dc]">
            {Object.entries(lastData.value)
              .map(([k, v]) => `${k}: ${typeof v === 'number' ? formatPrice(v, 4) : v}`)
              .join(' | ')}
          </span>
        )}
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
