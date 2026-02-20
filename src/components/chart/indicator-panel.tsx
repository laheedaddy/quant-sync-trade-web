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
  indicatorColorMap?: Map<number, Record<string, string>>;
  indicatorLineWidthMap?: Map<number, Record<string, number>>;
  /** Crosshair time from sync manager (for legend value updates across charts) */
  crosshairTime?: number | null;
}

export function IndicatorPanel({ candles, indicators, syncManager, indicatorActions, activeConfigNos, indicatorColorMap, indicatorLineWidthMap, crosshairTime }: IndicatorPanelProps) {
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
          customColors={indicatorColorMap?.get(indicator.indicatorConfigNo)}
          customLineWidths={indicatorLineWidthMap?.get(indicator.indicatorConfigNo)}
          crosshairTime={crosshairTime}
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
  customColors?: Record<string, string>;
  customLineWidths?: Record<string, number>;
  /** Crosshair time from parent (sync manager) — covers cross-chart sync */
  crosshairTime?: number | null;
}

function SingleIndicatorPanel({ indicator, candleTimestamps, syncManager, indicatorActions, isActive, customColors, customLineWidths, crosshairTime }: SingleIndicatorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map());
  const { showReferenceLines, timeframe } = useChartStore();

  const config = getIndicatorSeriesConfig(indicator.indicatorType as IndicatorType, customColors, customLineWidths);

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

    let firstSeries: ISeriesApi<SeriesType> | null = null;
    let firstSeriesDataMap: Map<number, number> | null = null;

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
        if (!firstSeries) {
          firstSeries = series;
          firstSeriesDataMap = new Map<number, number>();
          for (const d of data) firstSeriesDataMap.set(d.time as number, d.value);
        }
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
        if (!firstSeries) {
          firstSeries = series;
          firstSeriesDataMap = new Map<number, number>();
          for (const d of data) firstSeriesDataMap.set(d.time as number, d.value);
        }
      }
    }

    // Register first series with sync manager for crosshair sync
    if (firstSeries && firstSeriesDataMap) {
      syncManager?.setMainSeries(chart, firstSeries, firstSeriesDataMap);
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

  // Build time→data map for O(1) crosshair lookup
  const dataByTime = useMemo(() => {
    const map = new Map<number, (typeof indicator.data)[0]>();
    for (const d of indicator.data) {
      const ts = Math.floor(new Date(d.calculatedAt).getTime() / 1000);
      map.set(ts, d);
    }
    return map;
  }, [indicator.data]);

  // Show indicator values at crosshair position (fallback to last data)
  const displayData = useMemo(() => {
    if (crosshairTime != null) {
      const matched = dataByTime.get(crosshairTime);
      if (matched) return matched;
    }
    return indicator.data[indicator.data.length - 1];
  }, [crosshairTime, dataByTime, indicator.data]);

  return (
    <div className="relative border-t border-[#1e222d] flex-1 min-h-0">
      <div className="absolute top-1 left-2 z-10 flex items-center gap-2 pointer-events-none">
        {/* 이름: 호버 영역 (pointer-events-auto) */}
        <div className="group flex items-center gap-1 pointer-events-auto">
          <span className="text-xs font-mono font-semibold text-[#787b86] cursor-default">
            {indicator.displayName}
          </span>

          {/* 액션 버튼 - opacity 기반 (레이아웃 변경 없음) */}
          {indicatorActions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={() => indicatorActions.onEdit(indicator.indicatorConfigNo)}
                className="p-0.5 text-[#9598a1] hover:text-[#d1d4dc] transition-colors"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => indicatorActions.onToggle(indicator.indicatorConfigNo)}
                className="p-0.5 text-[#9598a1] hover:text-[#d1d4dc] transition-colors"
                title={isActive ? 'Hide' : 'Show'}
              >
                {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => indicatorActions.onDelete(indicator.indicatorConfigNo)}
                className="p-0.5 text-[#9598a1] hover:text-[#ef5350] transition-colors"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {displayData && (
          <span className="text-xs font-mono text-[#d1d4dc]">
            {(config.legendKeys ?? config.series.map((s) => s.key))
              .filter((key) => displayData.value[key] != null)
              .map((key) => {
                const v = displayData.value[key];
                return `${key}: ${typeof v === 'number' ? formatPrice(v, 4) : v}`;
              })
              .join(' | ')}
          </span>
        )}
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
