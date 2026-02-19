import type { UTCTimestamp, WhitespaceData } from 'lightweight-charts';
import type { ChartCandle, ChartIndicatorData } from '@/types/chart';

export interface LWCCandleData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LWCVolumeData {
  time: UTCTimestamp;
  value: number;
  color: string;
}

export interface LWCLineData {
  time: UTCTimestamp;
  value: number;
}

export interface LWCHistogramData {
  time: UTCTimestamp;
  value: number;
  color: string;
}

/**
 * Display time offset (seconds) for chart labeling.
 * All timeframes use open-time (standard convention matching TradingView/Binance/FMP).
 * DB `tradedAt` is already open-time, so no offset is needed.
 */
export function getDisplayTimeOffset(_timeframe: string): number {
  return 0;
}

function toTimestamp(dateStr: string, offsetSeconds = 0): UTCTimestamp {
  return (Math.floor(new Date(dateStr).getTime() / 1000) + offsetSeconds) as UTCTimestamp;
}

export function num(v: unknown): number {
  return typeof v === 'string' ? parseFloat(v) : Number(v);
}

export function transformHeikinAshi(candles: ChartCandle[], timeframe?: string): LWCCandleData[] {
  const offset = timeframe ? getDisplayTimeOffset(timeframe) : 0;
  const sorted = [...candles].sort(
    (a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime(),
  );

  const result: LWCCandleData[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    const o = num(c.openPrice);
    const h = num(c.highPrice);
    const l = num(c.lowPrice);
    const cl = num(c.closePrice);

    const haClose = (o + h + l + cl) / 4;
    const haOpen = i === 0
      ? (o + cl) / 2
      : (result[i - 1].open + result[i - 1].close) / 2;
    const haHigh = Math.max(h, haOpen, haClose);
    const haLow = Math.min(l, haOpen, haClose);

    result.push({
      time: toTimestamp(c.tradedAt, offset),
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });
  }

  return result;
}

export function transformCandles(candles: ChartCandle[], timeframe?: string): LWCCandleData[] {
  const offset = timeframe ? getDisplayTimeOffset(timeframe) : 0;
  return candles
    .map((c) => ({
      time: toTimestamp(c.tradedAt, offset),
      open: num(c.openPrice),
      high: num(c.highPrice),
      low: num(c.lowPrice),
      close: num(c.closePrice),
    }))
    .sort((a, b) => (a.time as number) - (b.time as number));
}

export function transformVolume(candles: ChartCandle[], timeframe?: string): LWCVolumeData[] {
  const offset = timeframe ? getDisplayTimeOffset(timeframe) : 0;
  return candles
    .map((c) => ({
      time: toTimestamp(c.tradedAt, offset),
      value: num(c.volume),
      color: num(c.closePrice) >= num(c.openPrice)
        ? 'rgba(38, 166, 154, 0.3)'
        : 'rgba(239, 83, 80, 0.3)',
    }))
    .sort((a, b) => (a.time as number) - (b.time as number));
}

export function transformIndicatorLine(
  data: ChartIndicatorData[],
  key: string,
  timeframe?: string,
): LWCLineData[] {
  const offset = timeframe ? getDisplayTimeOffset(timeframe) : 0;
  return data
    .filter((d) => d.value[key] != null)
    .map((d) => ({
      time: toTimestamp(d.calculatedAt, offset),
      value: num(d.value[key]),
    }))
    .sort((a, b) => (a.time as number) - (b.time as number));
}

export function transformIndicatorHistogram(
  data: ChartIndicatorData[],
  key: string,
  positiveColor: string,
  negativeColor: string,
  timeframe?: string,
): LWCHistogramData[] {
  const offset = timeframe ? getDisplayTimeOffset(timeframe) : 0;
  return data
    .filter((d) => d.value[key] != null)
    .map((d) => {
      const val = num(d.value[key]);
      return {
        time: toTimestamp(d.calculatedAt, offset),
        value: val,
        color: val >= 0 ? positiveColor : negativeColor,
      };
    })
    .sort((a, b) => (a.time as number) - (b.time as number));
}

/** Timeframe → bucket interval in seconds */
const TIMEFRAME_SECONDS: Record<string, number> = {
  '1min': 60,
  '3min': 180,
  '5min': 300,
  '10min': 600,
  '15min': 900,
  '30min': 1800,
  '1hour': 3600,
  '4hour': 14400,
  '1day': 86400,
  '1week': 604800,
};

/**
 * Calculate the display timestamp for the current forming candle.
 * All timeframes use open-time convention: bucket_start.
 * e.g., at 09:33:30, 1min bucket start = 09:33 → display = 09:33.
 */
export function getCurrentBucketTimestamp(timeframe: string): UTCTimestamp {
  const now = new Date();
  const interval = TIMEFRAME_SECONDS[timeframe];
  if (!interval) return (Math.floor(now.getTime() / 1000)) as UTCTimestamp;

  if (timeframe === '1week') {
    const MONDAY_EPOCH = 345600;
    const nowSec = Math.floor(now.getTime() / 1000);
    return (Math.floor((nowSec - MONDAY_EPOCH) / interval) * interval + MONDAY_EPOCH) as UTCTimestamp;
  }

  if (timeframe === '1day') {
    return (Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000)) as UTCTimestamp;
  }

  // Minute-based timeframes: floor to interval boundary (open-time convention)
  const utcMs = Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    now.getUTCHours(), now.getUTCMinutes(),
  );
  const intervalMs = interval * 1000;
  const bucketStart = Math.floor(utcMs / intervalMs) * intervalMs / 1000;
  return bucketStart as UTCTimestamp;
}

/** Extract sorted timestamps from candles (with display offset applied) */
export function getCandleTimestamps(candles: ChartCandle[], timeframe?: string): UTCTimestamp[] {
  const offset = timeframe ? getDisplayTimeOffset(timeframe) : 0;
  return candles
    .map((c) => toTimestamp(c.tradedAt, offset))
    .sort((a, b) => (a as number) - (b as number));
}

/**
 * Pad series data with whitespace entries so that logical indices
 * align with the main candle chart's timestamps.
 */
export function padWithWhitespace<T extends { time: UTCTimestamp }>(
  data: T[],
  allTimestamps: UTCTimestamp[],
): (T | WhitespaceData)[] {
  const dataTimeSet = new Set(data.map((d) => d.time as number));
  const whitespace: WhitespaceData[] = allTimestamps
    .filter((ts) => !dataTimeSet.has(ts as number))
    .map((ts) => ({ time: ts }));

  return [...whitespace, ...data].sort(
    (a, b) => (a.time as number) - (b.time as number),
  );
}
