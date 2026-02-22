'use client';

import { useRef, useEffect, useState } from 'react';
import type { IChartApi, ISeriesApi, SeriesType, MouseEventParams, UTCTimestamp } from 'lightweight-charts';
import { createChart, createSeriesMarkers, CandlestickSeries, HistogramSeries, LineSeries, AreaSeries, type LineWidth } from 'lightweight-charts';
import type { ISeriesMarkersPluginApi } from 'lightweight-charts';
import type { ChartCandle, ChartIndicator, IndicatorType, UserChartDrawing, DrawingToolMode, CreateChartDrawingRequest, DrawingPoint } from '@/types/chart';
import type { BacktestTrade } from '@/types/backtest';
import { useChartStore } from '@/stores/chart-store';
import { CHART_COLORS, createChartTheme } from '@/lib/chart/theme';
import {
  transformCandles,
  transformHeikinAshi,
  transformVolume,
  transformIndicatorLine,
  getCurrentBucketTimestamp,
  getDisplayTimeOffset,
  num,
} from '@/lib/chart/utils';
import { getIndicatorSeriesConfig, isOverlayIndicator } from '@/lib/chart/indicators';
import type { IDrawingPrimitive } from '@/lib/chart/primitives/drawing-primitive';
import { ParallelChannelPrimitive } from '@/lib/chart/primitives/parallel-channel-primitive';
import { RayPrimitive } from '@/lib/chart/primitives/ray-primitive';
import { HorizontalLinePrimitive } from '@/lib/chart/primitives/horizontal-line-primitive';
import { DrawingInteractionManager } from '@/lib/chart/drawing-interaction-manager';
import { DrawingEditManager } from '@/lib/chart/drawing-edit-manager';
import type { ChartSyncManager } from '@/lib/chart/sync';
import { ChartLegend } from './chart-legend';
import { Skeleton } from '@/components/ui/skeleton';
import type { RealtimeQuote } from '@/types/quote';

function createPrimitiveForDrawing(drawing: UserChartDrawing): IDrawingPrimitive {
  switch (drawing.drawingType) {
    case 'RAY':
      return new RayPrimitive(drawing.points, drawing.style);
    case 'HORIZONTAL_LINE':
      return new HorizontalLinePrimitive(drawing.points, drawing.style);
    default:
      return new ParallelChannelPrimitive(drawing.points, drawing.style);
  }
}

interface IndicatorActions {
  onEdit: (configNo: number) => void;
  onToggle: (configNo: number) => void;
  onDelete: (configNo: number) => void;
}

interface DrawingActions {
  onEdit: (drawingNo: number) => void;
  onToggle: (drawingNo: number) => void;
  onDelete: (drawingNo: number) => void;
}

interface CandlestickChartProps {
  candles: ChartCandle[];
  indicators: ChartIndicator[];
  isLoading: boolean;
  onVisibleTimeRangeChange?: () => void;
  onCrosshairMove?: (params: MouseEventParams) => void;
  syncManager?: ChartSyncManager;
  backtestTrades?: BacktestTrade[];
  drawings?: UserChartDrawing[];
  toolMode?: DrawingToolMode;
  onDrawingComplete?: (request: CreateChartDrawingRequest) => void;
  onDrawingCancel?: () => void;
  onDrawingUpdate?: (drawingNo: number, points: DrawingPoint[]) => Promise<void>;
  onDrawingDelete?: (drawingNo: number) => Promise<void>;
  indicatorActions?: IndicatorActions;
  activeConfigNos?: number[];
  drawingActions?: DrawingActions;
  activeDrawingNos?: number[];
  realtimeQuote?: RealtimeQuote | null;
  onRefetch?: () => void;
  indicatorColorMap?: Map<number, Record<string, string>>;
  indicatorLineWidthMap?: Map<number, Record<string, number>>;
}

export function CandlestickChart({
  candles,
  indicators,
  isLoading,
  onVisibleTimeRangeChange,
  onCrosshairMove,
  syncManager,
  backtestTrades,
  drawings,
  toolMode,
  onDrawingComplete,
  onDrawingCancel,
  onDrawingUpdate,
  onDrawingDelete,
  indicatorActions,
  activeConfigNos,
  drawingActions,
  activeDrawingNos,
  realtimeQuote,
  onRefetch,
  indicatorColorMap,
  indicatorLineWidthMap,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map());
  const prevCandleCountRef = useRef(0);
  const prevDisplayTypeRef = useRef<string | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<any> | null>(null);
  const drawingPrimitivesRef = useRef<Map<number, IDrawingPrimitive>>(new Map());
  const interactionManagerRef = useRef<DrawingInteractionManager | null>(null);
  const editManagerRef = useRef<DrawingEditManager | null>(null);
  const drawingsDataRef = useRef(drawings);
  drawingsDataRef.current = drawings;
  const onDrawingUpdateRef = useRef(onDrawingUpdate);
  onDrawingUpdateRef.current = onDrawingUpdate;
  const onDrawingDeleteRef = useRef(onDrawingDelete);
  onDrawingDeleteRef.current = onDrawingDelete;
  const backtestTradesRef = useRef(backtestTrades);
  backtestTradesRef.current = backtestTrades;
  const [hoveredCandle, setHoveredCandle] = useState<ChartCandle | null>(null);

  const { candleDisplayType, priceScaleMode, symbol, timeframe } = useChartStore();
  const prevDatasetKeyRef = useRef(`${symbol}:${timeframe}`);

  // Refs for realtime tick updates (read without triggering effects)
  const candlesRef = useRef(candles);
  candlesRef.current = candles;
  const candleDisplayTypeRef = useRef(candleDisplayType);
  candleDisplayTypeRef.current = candleDisplayType;
  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;
  // Accumulated OHLC state of the last bar (for series.update)
  const lastBarRef = useRef<{ time: UTCTimestamp; open: number; high: number; low: number; close: number } | null>(null);
  // Raw OHLC accumulation — HA mode only
  const lastRawOHLCRef = useRef<{ open: number; high: number; low: number } | null>(null);
  // Previous HA candle — HA mode only (fixed until REST refresh)
  const prevHACandleRef = useRef<{ open: number; close: number } | null>(null);
  // Volume info for realtime volume bar color update
  const lastVolumeRef = useRef<{ value: number; openPrice: number }>({ value: 0, openPrice: 0 });
  // Last known indicator value per overlay series (for extending to forming candle)
  const lastIndicatorValueRef = useRef<Map<string, number>>(new Map());
  // Ref for timeframe (used in tick effect without triggering re-render)
  const timeframeRef = useRef(timeframe);
  timeframeRef.current = timeframe;
  // Ref for onRefetch callback
  const onRefetchRef = useRef(onRefetch);
  onRefetchRef.current = onRefetch;
  // Delayed refetch timer for bucket transitions
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    prevDisplayTypeRef.current = null;

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
      if (interactionManagerRef.current) {
        interactionManagerRef.current.stop();
        interactionManagerRef.current = null;
      }
      if (editManagerRef.current) {
        editManagerRef.current.stop();
        editManagerRef.current = null;
      }
      drawingPrimitivesRef.current.clear();
      if (markersPluginRef.current) {
        markersPluginRef.current.detach();
        markersPluginRef.current = null;
      }
      seriesRef.current.clear();
      chart.remove();
      chartRef.current = null;
    };
  }, [syncManager]);

  // Apply price scale mode
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chart.priceScale('right').applyOptions({ mode: priceScaleMode });
  }, [priceScaleMode]);

  // Subscribe crosshair
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handler = (params: MouseEventParams) => {
      onCrosshairMove?.(params);

      if (!params.time || !params.seriesData) {
        return;
      }

      // Always look up from raw candles by time for legend (regardless of display type)
      const offset = getDisplayTimeOffset(timeframe);
      const idx = candles.findIndex((c) => {
        const ts = Math.floor(new Date(c.tradedAt).getTime() / 1000) + offset;
        return ts === params.time;
      });
      if (idx >= 0) setHoveredCandle(candles[idx]);
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

  // Update candle + volume data (depends on candles AND candleDisplayType)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // 데이터 없는 심볼: 기존 시리즈 데이터 클리어
    if (candles.length === 0) {
      const candleSeries = seriesRef.current.get('candles');
      if (candleSeries) candleSeries.setData([]);
      const volumeSeries = seriesRef.current.get('volume');
      if (volumeSeries) volumeSeries.setData([]);
      lastBarRef.current = null;
      lastRawOHLCRef.current = null;
      prevHACandleRef.current = null;
      setHoveredCandle(null);
      prevCandleCountRef.current = 0;
      return;
    }

    const currentDatasetKey = `${symbol}:${timeframe}`;
    const datasetChanged = prevDatasetKeyRef.current !== currentDatasetKey;
    if (datasetChanged) {
      prevDatasetKeyRef.current = currentDatasetKey;
      // Clear realtime refs to prevent stale data from previous symbol
      lastBarRef.current = null;
      lastRawOHLCRef.current = null;
      prevHACandleRef.current = null;
      lastVolumeRef.current = { value: 0, openPrice: 0 };
    }

    const displayTypeChanged = prevDisplayTypeRef.current !== null && prevDisplayTypeRef.current !== candleDisplayType;

    // If display type changed, we need to tear down the old candle series and everything attached to it
    if (displayTypeChanged) {
      const oldSeries = seriesRef.current.get('candles');
      if (oldSeries) {
        // 1. Detach markers plugin
        if (markersPluginRef.current) {
          markersPluginRef.current.detach();
          markersPluginRef.current = null;
        }

        // 2. Detach drawing primitives
        const primitiveMap = drawingPrimitivesRef.current;
        for (const [, primitive] of primitiveMap) {
          oldSeries.detachPrimitive(primitive);
        }

        // 3. Stop edit/interaction managers
        if (interactionManagerRef.current) {
          interactionManagerRef.current.stop();
          interactionManagerRef.current = null;
        }
        if (editManagerRef.current) {
          editManagerRef.current.stop();
          editManagerRef.current = null;
        }

        // 4. Remove old series
        chart.removeSeries(oldSeries);
        seriesRef.current.delete('candles');
      }
    }

    prevDisplayTypeRef.current = candleDisplayType;

    // Create candle series based on display type
    let candleSeries = seriesRef.current.get('candles');
    if (!candleSeries) {
      if (candleDisplayType === 'line') {
        candleSeries = chart.addSeries(LineSeries, {
          color: CHART_COLORS.bullish,
          lineWidth: 2 as LineWidth,
          priceScaleId: 'right',
          lastValueVisible: true,
          priceLineVisible: true,
        });
      } else if (candleDisplayType === 'area') {
        candleSeries = chart.addSeries(AreaSeries, {
          topColor: 'rgba(38, 166, 154, 0.4)',
          bottomColor: 'rgba(38, 166, 154, 0.0)',
          lineColor: CHART_COLORS.bullish,
          lineWidth: 2 as LineWidth,
          priceScaleId: 'right',
          lastValueVisible: true,
          priceLineVisible: true,
        });
      } else {
        // 'candles' or 'heikin_ashi' — both use CandlestickSeries
        candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: CHART_COLORS.bullish,
          downColor: CHART_COLORS.bearish,
          borderUpColor: CHART_COLORS.bullish,
          borderDownColor: CHART_COLORS.bearish,
          wickUpColor: CHART_COLORS.bullish,
          wickDownColor: CHART_COLORS.bearish,
        });
      }
      seriesRef.current.set('candles', candleSeries);
    }

    // Set data based on display type & initialize realtime update refs
    const priceDataMap = new Map<number, number>();
    if (candleDisplayType === 'line' || candleDisplayType === 'area') {
      const transformed = transformCandles(candles, timeframe);
      const lineData = transformed.map((c) => ({
        time: c.time,
        value: c.close,
      }));
      candleSeries.setData(lineData);
      for (const c of transformed) priceDataMap.set(c.time as number, c.close);
      if (transformed.length > 0) {
        const last = transformed[transformed.length - 1];
        lastBarRef.current = { time: last.time, open: last.open, high: last.high, low: last.low, close: last.close };
      }
      lastRawOHLCRef.current = null;
      prevHACandleRef.current = null;
    } else if (candleDisplayType === 'heikin_ashi') {
      const haData = transformHeikinAshi(candles, timeframe);
      candleSeries.setData(haData);
      for (const c of haData) priceDataMap.set(c.time as number, c.close);
      if (haData.length >= 2) {
        const sl = haData[haData.length - 2];
        prevHACandleRef.current = { open: sl.open, close: sl.close };
      } else {
        prevHACandleRef.current = null;
      }
      if (haData.length > 0) {
        const last = haData[haData.length - 1];
        lastBarRef.current = { time: last.time, open: last.open, high: last.high, low: last.low, close: last.close };
      }
    } else {
      const transformed = transformCandles(candles, timeframe);
      candleSeries.setData(transformed);
      for (const c of transformed) priceDataMap.set(c.time as number, c.close);
      if (transformed.length > 0) {
        const last = transformed[transformed.length - 1];
        lastBarRef.current = { time: last.time, open: last.open, high: last.high, low: last.low, close: last.close };
      }
      lastRawOHLCRef.current = null;
      prevHACandleRef.current = null;
    }

    // Register with sync manager for crosshair sync
    syncManager?.setMainSeries(chart, candleSeries, priceDataMap);

    // Initialize volume & raw OHLC refs for realtime tick updates
    {
      const sorted = [...candles].sort((a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime());
      if (sorted.length > 0) {
        const lr = sorted[sorted.length - 1];
        lastVolumeRef.current = { value: num(lr.volume), openPrice: num(lr.openPrice) };
        if (candleDisplayType === 'heikin_ashi') {
          lastRawOHLCRef.current = { open: num(lr.openPrice), high: num(lr.highPrice), low: num(lr.lowPrice) };
        }
      }
    }

    // Volume series (always histogram, independent of candle type)
    let volumeSeries = seriesRef.current.get('volume');
    if (!volumeSeries) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        lastValueVisible: false,
        priceLineVisible: false,
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      seriesRef.current.set('volume', volumeSeries);
    }
    volumeSeries.setData(transformVolume(candles, timeframe));

    // fitContent on first load or when dataset changes (symbol/timeframe switch)
    if (prevCandleCountRef.current === 0 || datasetChanged) {
      chart.priceScale('right').applyOptions({ autoScale: true });
      chart.timeScale().fitContent();
    }
    prevCandleCountRef.current = candles.length;

    // Set last candle as default legend
    setHoveredCandle(candles[candles.length - 1]);

    // If display type changed, re-attach drawings and re-create markers
    if (displayTypeChanged) {
      // Re-attach drawing primitives to new series
      const primitiveMap = drawingPrimitivesRef.current;
      for (const [, primitive] of primitiveMap) {
        candleSeries.attachPrimitive(primitive);
      }

      // Re-create markers
      const trades = backtestTradesRef.current;
      if (trades && trades.length > 0) {
        const markerOffset = getDisplayTimeOffset(timeframe);
        const markers: Array<{
          time: number;
          position: 'belowBar' | 'aboveBar';
          color: string;
          shape: 'arrowUp' | 'arrowDown';
          text: string;
        }> = [];

        for (const trade of trades) {
          const entryTs = Math.floor(new Date(trade.entryDate).getTime() / 1000) + markerOffset;
          markers.push({
            time: entryTs,
            position: 'belowBar',
            color: '#26a69a',
            shape: 'arrowUp',
            text: 'B',
          });
          if (trade.exitDate) {
            const exitTs = Math.floor(new Date(trade.exitDate).getTime() / 1000) + markerOffset;
            markers.push({
              time: exitTs,
              position: 'aboveBar',
              color: '#ef5350',
              shape: 'arrowDown',
              text: 'S',
            });
          }
        }
        markers.sort((a, b) => a.time - b.time);
        markersPluginRef.current = createSeriesMarkers(candleSeries, markers as any);
      }

      // Restart edit manager
      if (!toolMode || toolMode === 'none') {
        const manager = new DrawingEditManager({
          chart,
          series: candleSeries,
          primitiveMap: drawingPrimitivesRef.current,
          getDrawings: () => drawingsDataRef.current ?? [],
          onUpdate: async (drawingNo, points) => {
            await onDrawingUpdateRef.current?.(drawingNo, points);
          },
          onDelete: async (drawingNo) => {
            await onDrawingDeleteRef.current?.(drawingNo);
          },
        });
        editManagerRef.current = manager;
        manager.start();
      }
    }
  }, [candles, candleDisplayType, symbol, timeframe]);

  // Cleanup refetch timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current);
    };
  }, []);

  // Realtime tick → series.update() (imperative, no React re-render)
  // Detects candle bucket transitions and creates new bars + triggers refetch
  useEffect(() => {
    if (!realtimeQuote) return;
    // Guard: ignore ticks from a different symbol (stale quote during symbol switch)
    if (realtimeQuote.symbol !== symbolRef.current) return;

    const candleSeries = seriesRef.current.get('candles');
    const volumeSeries = seriesRef.current.get('volume');
    if (!candleSeries) return;

    const bar = lastBarRef.current;
    if (!bar) return;

    const displayType = candleDisplayTypeRef.current;
    const price = realtimeQuote.price;

    // Detect bucket transition: is the current time in a new bucket?
    const currentBucket = getCurrentBucketTimestamp(timeframeRef.current);

    if (currentBucket > bar.time) {
      // New bucket! Create a new bar at the current bucket position
      const newTime = currentBucket;

      if (displayType === 'heikin_ashi') {
        // Save previous HA candle for HA calculation
        prevHACandleRef.current = { open: bar.open, close: bar.close };
        lastRawOHLCRef.current = { open: price, high: price, low: price };

        const prev = prevHACandleRef.current;
        const haClose = (price + price + price + price) / 4; // O=H=L=C=price
        const haOpen = (prev.open + prev.close) / 2;
        const haHigh = Math.max(price, haOpen, haClose);
        const haLow = Math.min(price, haOpen, haClose);

        lastBarRef.current = { time: newTime, open: haOpen, high: haHigh, low: haLow, close: haClose };
        candleSeries.update({ time: newTime, open: haOpen, high: haHigh, low: haLow, close: haClose });
      } else if (displayType === 'line' || displayType === 'area') {
        lastBarRef.current = { time: newTime, open: price, high: price, low: price, close: price };
        candleSeries.update({ time: newTime, value: price });
      } else {
        // Normal candles: O=H=L=C=price
        lastBarRef.current = { time: newTime, open: price, high: price, low: price, close: price };
        candleSeries.update({ time: newTime, open: price, high: price, low: price, close: price });
      }

      // Reset volume for new bar
      lastVolumeRef.current = { value: 0, openPrice: price };
      if (volumeSeries) {
        volumeSeries.update({ time: newTime, value: 0, color: 'rgba(38, 166, 154, 0.3)' });
      }

      // Extend overlay indicator series to new bucket timestamp
      for (const [key, series] of seriesRef.current) {
        if (!key.startsWith('indicator-overlay-')) continue;
        const lastValue = lastIndicatorValueRef.current.get(key);
        if (lastValue != null) {
          series.update({ time: newTime, value: lastValue });
        }
      }

      // Trigger delayed refetch (3s delay so the collector has time to update Redis)
      // Guard: skip refetch if market is fully closed (no fresh tick within 10s)
      if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current);
      const tickReceivedAt = Date.now();
      refetchTimeoutRef.current = setTimeout(() => {
        const elapsed = Date.now() - tickReceivedAt;
        if (elapsed > 10000) return; // tick too stale — market likely closed
        onRefetchRef.current?.();
      }, 3000);

      return;
    }

    // Same bucket: update existing bar
    const { time } = bar;

    if (displayType === 'line' || displayType === 'area') {
      candleSeries.update({ time, value: price });
    } else if (displayType === 'heikin_ashi') {
      const rawAccum = lastRawOHLCRef.current;
      if (!rawAccum) return;

      // Accumulate raw high/low across ticks
      rawAccum.high = Math.max(rawAccum.high, price);
      rawAccum.low = Math.min(rawAccum.low, price);

      // Recalculate Heikin-Ashi for last bar
      const haClose = (rawAccum.open + rawAccum.high + rawAccum.low + price) / 4;
      const prev = prevHACandleRef.current;
      const haOpen = prev ? (prev.open + prev.close) / 2 : (rawAccum.open + price) / 2;
      const haHigh = Math.max(rawAccum.high, haOpen, haClose);
      const haLow = Math.min(rawAccum.low, haOpen, haClose);

      candleSeries.update({ time, open: haOpen, high: haHigh, low: haLow, close: haClose });
      bar.open = haOpen;
      bar.high = haHigh;
      bar.low = haLow;
      bar.close = haClose;
    } else {
      // Normal candles — accumulate high/low
      bar.high = Math.max(bar.high, price);
      bar.low = Math.min(bar.low, price);
      bar.close = price;

      candleSeries.update({ time, open: bar.open, high: bar.high, low: bar.low, close: bar.close });
    }

    // Update volume bar direction color
    if (volumeSeries) {
      const vol = lastVolumeRef.current;
      const color = price >= vol.openPrice ? 'rgba(38, 166, 154, 0.3)' : 'rgba(239, 83, 80, 0.3)';
      volumeSeries.update({ time, value: vol.value, color });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeQuote]);

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
      const customColors = indicatorColorMap?.get(ind.indicatorConfigNo);
      const customLineWidths = indicatorLineWidthMap?.get(ind.indicatorConfigNo);
      const config = getIndicatorSeriesConfig(ind.indicatorType as IndicatorType, customColors, customLineWidths);
      const isVisible = activeConfigNos ? activeConfigNos.includes(ind.indicatorConfigNo) : true;

      for (const seriesConfig of config.series) {
        const seriesId = `indicator-overlay-${ind.indicatorConfigNo}-${seriesConfig.key}`;
        let series = seriesRef.current.get(seriesId);

        if (!series) {
          series = chart.addSeries(LineSeries, {
            color: seriesConfig.color,
            lineWidth: (seriesConfig.lineWidth ?? 1) as LineWidth,
            priceScaleId: 'right',
            lastValueVisible: false,
            priceLineVisible: false,
            visible: isVisible,
          });
          seriesRef.current.set(seriesId, series);
        } else {
          series.applyOptions({ visible: isVisible, color: seriesConfig.color, lineWidth: (seriesConfig.lineWidth ?? 1) as LineWidth });
        }

        const lineData = transformIndicatorLine(ind.data, seriesConfig.key, timeframe);
        if (lineData.length > 0) {
          const lastPoint = lineData[lineData.length - 1];
          lastIndicatorValueRef.current.set(seriesId, lastPoint.value);
          // Extend indicator line to the forming candle's timestamp
          const lastBar = lastBarRef.current;
          if (lastBar && lastBar.time > lastPoint.time) {
            lineData.push({ time: lastBar.time, value: lastPoint.value });
          }
          series.setData(lineData);
        }
      }
    }

    // Hide overlay series that have no matching indicator data but exist in seriesRef
    for (const [key, series] of seriesRef.current) {
      if (key.startsWith('indicator-overlay-')) {
        const configNo = parseInt(key.split('-')[2]);
        if (!overlayIndicators.find((ind) => ind.indicatorConfigNo === configNo)) continue;
        const isVisible = activeConfigNos ? activeConfigNos.includes(configNo) : true;
        series.applyOptions({ visible: isVisible });
      }
    }
  }, [indicators, activeConfigNos, indicatorColorMap, indicatorLineWidthMap]);

  // Update backtest markers
  useEffect(() => {
    const candleSeries = seriesRef.current.get('candles');
    if (!candleSeries) return;

    // Clean up previous markers plugin
    if (markersPluginRef.current) {
      markersPluginRef.current.detach();
      markersPluginRef.current = null;
    }

    if (!backtestTrades || backtestTrades.length === 0) {
      return;
    }

    const markerOffset = getDisplayTimeOffset(timeframe);
    const markers: Array<{
      time: number;
      position: 'belowBar' | 'aboveBar';
      color: string;
      shape: 'arrowUp' | 'arrowDown';
      text: string;
    }> = [];

    for (const trade of backtestTrades) {
      // Entry marker (BUY)
      const entryTs = Math.floor(new Date(trade.entryDate).getTime() / 1000) + markerOffset;
      markers.push({
        time: entryTs,
        position: 'belowBar',
        color: '#26a69a',
        shape: 'arrowUp',
        text: 'B',
      });

      // Exit marker (SELL)
      if (trade.exitDate) {
        const exitTs = Math.floor(new Date(trade.exitDate).getTime() / 1000) + markerOffset;
        markers.push({
          time: exitTs,
          position: 'aboveBar',
          color: '#ef5350',
          shape: 'arrowDown',
          text: 'S',
        });
      }
    }

    // Sort by time (required by lightweight-charts)
    markers.sort((a, b) => a.time - b.time);

    // Create markers plugin (v5 API)
    markersPluginRef.current = createSeriesMarkers(candleSeries, markers as any);
  }, [backtestTrades, candles, timeframe]);

  // Render saved drawings as primitives
  useEffect(() => {
    const candleSeries = seriesRef.current.get('candles');
    if (!candleSeries || !drawings) return;

    const currentIds = new Set(drawings.map((d) => d.userChartDrawingNo));
    const hiddenSet = new Set(activeDrawingNos != null
      ? drawings.map((d) => d.userChartDrawingNo).filter((no) => !activeDrawingNos.includes(no))
      : []);
    const primitiveMap = drawingPrimitivesRef.current;

    // Remove primitives for deleted drawings
    for (const [drawingNo, primitive] of primitiveMap) {
      if (!currentIds.has(drawingNo)) {
        candleSeries.detachPrimitive(primitive);
        primitiveMap.delete(drawingNo);
      }
    }

    // Add or update primitives for current drawings
    for (const drawing of drawings) {
      const drawingNo = drawing.userChartDrawingNo;
      const isHidden = hiddenSet.has(drawingNo);
      const existing = primitiveMap.get(drawingNo);

      if (isHidden) {
        // Detach hidden drawing
        if (existing) {
          candleSeries.detachPrimitive(existing);
          primitiveMap.delete(drawingNo);
        }
      } else if (existing) {
        // Update existing primitive
        existing.updatePoints(drawing.points);
        existing.updateStyle(drawing.style);
      } else {
        // Attach new primitive
        const primitive = createPrimitiveForDrawing(drawing);
        candleSeries.attachPrimitive(primitive);
        primitiveMap.set(drawingNo, primitive);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawings, candles.length, activeDrawingNos]);

  // Manage drawing interaction manager based on toolMode
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = seriesRef.current.get('candles');
    if (!chart || !candleSeries) return;

    // Clean up previous managers
    if (interactionManagerRef.current) {
      interactionManagerRef.current.stop();
      interactionManagerRef.current = null;
    }
    if (editManagerRef.current) {
      editManagerRef.current.stop();
      editManagerRef.current = null;
    }

    if (toolMode && toolMode !== 'none' && onDrawingComplete && onDrawingCancel) {
      // Creation mode
      const manager = new DrawingInteractionManager({
        chart,
        series: candleSeries,
        onComplete: onDrawingComplete,
        onCancel: onDrawingCancel,
        priceScaleMode,
        drawingToolMode: toolMode,
      });
      interactionManagerRef.current = manager;
      manager.start();
    } else if (!toolMode || toolMode === 'none') {
      // Edit mode — active when no tool is selected
      const manager = new DrawingEditManager({
        chart,
        series: candleSeries,
        primitiveMap: drawingPrimitivesRef.current,
        getDrawings: () => drawingsDataRef.current ?? [],
        onUpdate: async (drawingNo, points) => {
          await onDrawingUpdateRef.current?.(drawingNo, points);
        },
        onDelete: async (drawingNo) => {
          await onDrawingDeleteRef.current?.(drawingNo);
        },
      });
      editManagerRef.current = manager;
      manager.start();
    }

    return () => {
      if (interactionManagerRef.current) {
        interactionManagerRef.current.stop();
        interactionManagerRef.current = null;
      }
      if (editManagerRef.current) {
        editManagerRef.current.stop();
        editManagerRef.current = null;
      }
    };
  }, [toolMode, onDrawingComplete, onDrawingCancel, priceScaleMode]);

  const showLoading = isLoading && candles.length === 0;

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {!showLoading && (
        <ChartLegend
          candle={hoveredCandle}
          indicators={indicators.filter((ind) => isOverlayIndicator(ind.indicatorType))}
          indicatorActions={indicatorActions}
          activeConfigNos={activeConfigNos}
          drawings={drawings}
          drawingActions={drawingActions}
          activeDrawingNos={activeDrawingNos}
          crosshairTimeSec={hoveredCandle ? Math.floor(new Date(hoveredCandle.tradedAt).getTime() / 1000) : null}
          indicatorColorMap={indicatorColorMap}
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
