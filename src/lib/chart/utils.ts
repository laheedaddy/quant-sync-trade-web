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

function toTimestamp(dateStr: string): UTCTimestamp {
  return (Math.floor(new Date(dateStr).getTime() / 1000)) as UTCTimestamp;
}

function num(v: unknown): number {
  return typeof v === 'string' ? parseFloat(v) : Number(v);
}

export function transformCandles(candles: ChartCandle[]): LWCCandleData[] {
  return candles
    .map((c) => ({
      time: toTimestamp(c.tradedAt),
      open: num(c.openPrice),
      high: num(c.highPrice),
      low: num(c.lowPrice),
      close: num(c.closePrice),
    }))
    .sort((a, b) => (a.time as number) - (b.time as number));
}

export function transformVolume(candles: ChartCandle[]): LWCVolumeData[] {
  return candles
    .map((c) => ({
      time: toTimestamp(c.tradedAt),
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
): LWCLineData[] {
  return data
    .filter((d) => d.value[key] != null)
    .map((d) => ({
      time: toTimestamp(d.calculatedAt),
      value: num(d.value[key]),
    }))
    .sort((a, b) => (a.time as number) - (b.time as number));
}

export function transformIndicatorHistogram(
  data: ChartIndicatorData[],
  key: string,
  positiveColor: string,
  negativeColor: string,
): LWCHistogramData[] {
  return data
    .filter((d) => d.value[key] != null)
    .map((d) => {
      const val = num(d.value[key]);
      return {
        time: toTimestamp(d.calculatedAt),
        value: val,
        color: val >= 0 ? positiveColor : negativeColor,
      };
    })
    .sort((a, b) => (a.time as number) - (b.time as number));
}

/** Extract sorted timestamps from candles */
export function getCandleTimestamps(candles: ChartCandle[]): UTCTimestamp[] {
  return candles
    .map((c) => toTimestamp(c.tradedAt))
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
