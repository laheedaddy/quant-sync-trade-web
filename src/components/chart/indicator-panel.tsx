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
import { createPanelChartTheme, INDICATOR_COLORS } from '@/lib/chart/theme';
import { getIndicatorSeriesConfig, isPanelIndicator } from '@/lib/chart/indicators';
import {
  transformIndicatorLine,
  transformIndicatorHistogram,
  getCandleTimestamps,
  padWithWhitespace,
} from '@/lib/chart/utils';
import { formatPrice } from '@/lib/utils/format';
import type { UTCTimestamp } from 'lightweight-charts';

interface IndicatorPanelProps {
  candles: ChartCandle[];
  indicators: ChartIndicator[];
  syncManager?: ChartSyncManager;
}

export function IndicatorPanel({ candles, indicators, syncManager }: IndicatorPanelProps) {
  const panelIndicators = indicators.filter((ind) => isPanelIndicator(ind.indicatorType));
  const candleTimestamps = useMemo(() => getCandleTimestamps(candles), [candles]);

  if (panelIndicators.length === 0) return null;

  return (
    <div className="flex flex-col border-t border-[#2a2e39]">
      {panelIndicators.map((indicator) => (
        <SingleIndicatorPanel
          key={indicator.indicatorConfigNo}
          indicator={indicator}
          candleTimestamps={candleTimestamps}
          syncManager={syncManager}
        />
      ))}
    </div>
  );
}

interface SingleIndicatorPanelProps {
  indicator: ChartIndicator;
  candleTimestamps: UTCTimestamp[];
  syncManager?: ChartSyncManager;
}

function SingleIndicatorPanel({ indicator, candleTimestamps, syncManager }: SingleIndicatorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map());

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
        });
        const data = transformIndicatorLine(indicator.data, seriesConfig.key);
        const paddedData = padWithWhitespace(data, candleTimestamps);
        if (paddedData.length > 0) series.setData(paddedData);
        seriesRef.current.set(seriesConfig.key, series);
      } else if (seriesConfig.seriesType === 'histogram') {
        const series = chart.addSeries(HistogramSeries, {
          priceScaleId: seriesConfig.priceScaleId,
        });
        const data = transformIndicatorHistogram(
          indicator.data,
          seriesConfig.key,
          INDICATOR_COLORS.MACD_HISTOGRAM_POSITIVE,
          INDICATOR_COLORS.MACD_HISTOGRAM_NEGATIVE,
        );
        const paddedData = padWithWhitespace(data, candleTimestamps);
        if (paddedData.length > 0) series.setData(paddedData);
        seriesRef.current.set(seriesConfig.key, series);
      }
    }

    // Add reference lines
    if (config.referenceLines) {
      for (const refLine of config.referenceLines) {
        const firstLineSeries = Array.from(seriesRef.current.values())[0];
        if (firstLineSeries) {
          firstLineSeries.createPriceLine({
            price: refLine.value,
            color: refLine.color,
            lineWidth: 1 as LineWidth,
            lineStyle: 2,
            axisLabelVisible: true,
            title: refLine.label,
          });
        }
      }
    }

    // Sync to main chart's current visible range
    syncManager?.applyCurrentRange(chart);
  }, [indicator, config, candleTimestamps, syncManager]);

  const lastData = indicator.data[indicator.data.length - 1];

  return (
    <div className="relative border-t border-[#1e222d]">
      <div className="absolute top-1 left-2 z-10 flex items-center gap-2 pointer-events-none">
        <span className="text-xs font-mono font-semibold text-[#787b86]">
          {indicator.displayName}
        </span>
        {lastData && (
          <span className="text-xs font-mono text-[#d1d4dc]">
            {Object.entries(lastData.value)
              .map(([k, v]) => `${k}: ${typeof v === 'number' ? formatPrice(v, 4) : v}`)
              .join(' | ')}
          </span>
        )}
      </div>
      <div ref={containerRef} className="w-full h-[120px]" />
    </div>
  );
}
