'use client';

import { useRef, useEffect, useState } from 'react';
import type { IChartApi, ISeriesApi, SeriesType, MouseEventParams } from 'lightweight-charts';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, type LineWidth } from 'lightweight-charts';
import type { ChartCandle, ChartIndicator, IndicatorType } from '@/types/chart';
import { CHART_COLORS, createChartTheme } from '@/lib/chart/theme';
import {
  transformCandles,
  transformVolume,
  transformIndicatorLine,
} from '@/lib/chart/utils';
import { getIndicatorSeriesConfig, isOverlayIndicator } from '@/lib/chart/indicators';
import type { ChartSyncManager } from '@/lib/chart/sync';
import { ChartLegend } from './chart-legend';
import { Skeleton } from '@/components/ui/skeleton';

interface CandlestickChartProps {
  candles: ChartCandle[];
  indicators: ChartIndicator[];
  isLoading: boolean;
  onVisibleTimeRangeChange?: () => void;
  onCrosshairMove?: (params: MouseEventParams) => void;
  syncManager?: ChartSyncManager;
}

export function CandlestickChart({
  candles,
  indicators,
  isLoading,
  onVisibleTimeRangeChange,
  onCrosshairMove,
  syncManager,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map());
  const prevCandleCountRef = useRef(0);
  const [hoveredCandle, setHoveredCandle] = useState<ChartCandle | null>(null);

  // Create chart
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      ...createChartTheme(),
      width: container.clientWidth,
      height: container.clientHeight,
      autoSize: true,
    });

    chartRef.current = chart;
    prevCandleCountRef.current = 0;

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

  // Subscribe crosshair
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handler = (params: MouseEventParams) => {
      onCrosshairMove?.(params);

      if (!params.time || !params.seriesData) {
        setHoveredCandle(null);
        return;
      }

      const candleSeries = seriesRef.current.get('candles');
      if (candleSeries) {
        const data = params.seriesData.get(candleSeries);
        if (data && 'open' in data) {
          const idx = candles.findIndex((c) => {
            const ts = Math.floor(new Date(c.tradedAt).getTime() / 1000);
            return ts === params.time;
          });
          if (idx >= 0) setHoveredCandle(candles[idx]);
        }
      }
    };

    chart.subscribeCrosshairMove(handler);
    return () => chart.unsubscribeCrosshairMove(handler);
  }, [candles, onCrosshairMove]);

  // Subscribe visible time range for load-more
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onVisibleTimeRangeChange) return;

    const timeScale = chart.timeScale();
    const handler = () => {
      const range = timeScale.getVisibleLogicalRange();
      if (range && range.from < 5) {
        onVisibleTimeRangeChange();
      }
    };

    timeScale.subscribeVisibleLogicalRangeChange(handler);
    return () => timeScale.unsubscribeVisibleLogicalRangeChange(handler);
  }, [onVisibleTimeRangeChange]);

  // Update candle + volume data (depends only on candles)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) return;

    // Candle series
    let candleSeries = seriesRef.current.get('candles');
    if (!candleSeries) {
      candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: CHART_COLORS.bullish,
        downColor: CHART_COLORS.bearish,
        borderUpColor: CHART_COLORS.bullish,
        borderDownColor: CHART_COLORS.bearish,
        wickUpColor: CHART_COLORS.bullish,
        wickDownColor: CHART_COLORS.bearish,
      });
      seriesRef.current.set('candles', candleSeries);
    }
    candleSeries.setData(transformCandles(candles));

    // Volume series
    let volumeSeries = seriesRef.current.get('volume');
    if (!volumeSeries) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      seriesRef.current.set('volume', volumeSeries);
    }
    volumeSeries.setData(transformVolume(candles));

    // Only fitContent on first load (not on every data update)
    if (prevCandleCountRef.current === 0) {
      chart.timeScale().fitContent();
    }
    prevCandleCountRef.current = candles.length;

    // Set last candle as default legend
    setHoveredCandle(candles[candles.length - 1]);
  }, [candles]);

  // Update overlay indicator series
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const overlayIndicators = indicators.filter((ind) =>
      isOverlayIndicator(ind.indicatorType),
    );

    // Remove old overlay series that are no longer present
    for (const [key] of seriesRef.current) {
      if (key.startsWith('indicator-overlay-')) {
        const configNo = parseInt(key.split('-')[2]);
        if (!overlayIndicators.find((ind) => ind.indicatorConfigNo === configNo)) {
          const series = seriesRef.current.get(key);
          if (series) chart.removeSeries(series);
          seriesRef.current.delete(key);
        }
      }
    }

    // Add/update overlay indicators
    for (const ind of overlayIndicators) {
      const config = getIndicatorSeriesConfig(ind.indicatorType as IndicatorType);

      for (const seriesConfig of config.series) {
        const seriesId = `indicator-overlay-${ind.indicatorConfigNo}-${seriesConfig.key}`;
        let series = seriesRef.current.get(seriesId);

        if (!series) {
          series = chart.addSeries(LineSeries, {
            color: seriesConfig.color,
            lineWidth: (seriesConfig.lineWidth ?? 1) as LineWidth,
            priceScaleId: 'right',
          });
          seriesRef.current.set(seriesId, series);
        }

        const lineData = transformIndicatorLine(ind.data, seriesConfig.key);
        if (lineData.length > 0) {
          series.setData(lineData);
        }
      }
    }
  }, [indicators]);

  const showLoading = isLoading && candles.length === 0;

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {!showLoading && (
        <ChartLegend
          candle={hoveredCandle}
          indicators={indicators.filter((ind) => isOverlayIndicator(ind.indicatorType))}
        />
      )}

      {showLoading && (
        <div className="absolute inset-0 bg-[#0a0e17] flex items-center justify-center">
          <Skeleton className="w-full h-full bg-[#131722]" />
        </div>
      )}
    </div>
  );
}
