import type { ChartCandle, ChartIndicator, Timeframe } from '@/types/chart';

function getTimeframeMs(tf: Timeframe): number {
  const map: Record<Timeframe, number> = {
    '1min': 60_000,
    '3min': 180_000,
    '5min': 300_000,
    '10min': 600_000,
    '15min': 900_000,
    '30min': 1_800_000,
    '1hour': 3_600_000,
    '4hour': 14_400_000,
    '1day': 86_400_000,
    '1week': 604_800_000,
  };
  return map[tf];
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateMockData(
  symbol: string,
  timeframe: Timeframe,
  activeIndicatorConfigNos: number[],
): { candles: ChartCandle[]; indicators: ChartIndicator[]; hasMore: boolean } {
  const count = 200;
  const intervalMs = getTimeframeMs(timeframe);
  const now = Date.now();
  const rand = seededRandom(symbol.length * 1000 + intervalMs);

  const priceMap: Record<string, number> = {
    AAPL: 195, MSFT: 420, GOOGL: 175, AMZN: 190, TSLA: 250,
  };
  let basePrice = priceMap[symbol] ?? 150;
  const candles: ChartCandle[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now - i * intervalMs).toISOString();
    const change = (rand() - 0.48) * basePrice * 0.02;
    const open = basePrice;
    const close = open + change;
    const high = Math.max(open, close) + rand() * basePrice * 0.005;
    const low = Math.min(open, close) - rand() * basePrice * 0.005;
    const volume = 100 + rand() * 10000;

    candles.push({
      tradedAt: time,
      openPrice: +open.toFixed(2),
      highPrice: +high.toFixed(2),
      lowPrice: +low.toFixed(2),
      closePrice: +close.toFixed(2),
      volume: +volume.toFixed(0),
    });

    basePrice = close;
  }

  const indicators: ChartIndicator[] = [];

  // Generate MA indicator if any config matches
  if (activeIndicatorConfigNos.length > 0) {
    const closes = candles.map((c) => c.closePrice);

    // Simple MA(20)
    const maData = closes.map((_, idx) => {
      if (idx < 19) return null;
      const sum = closes.slice(idx - 19, idx + 1).reduce((a, b) => a + b, 0);
      return {
        calculatedAt: candles[idx].tradedAt,
        value: { ma: +(sum / 20).toFixed(2) },
      };
    }).filter(Boolean) as ChartIndicator['data'];

    indicators.push({
      indicatorConfigNo: activeIndicatorConfigNos[0],
      indicatorType: 'MA',
      displayName: 'MA(20)',
      parameters: { period: 20 },
      data: maData,
    });

    // RSI(14) if more than one indicator is active
    if (activeIndicatorConfigNos.length > 1) {
      const rsiData = computeMockRSI(candles, 14);
      indicators.push({
        indicatorConfigNo: activeIndicatorConfigNos[1],
        indicatorType: 'RSI',
        displayName: 'RSI(14)',
        parameters: { period: 14 },
        data: rsiData,
      });
    }

    // MACD if more than two indicators are active
    if (activeIndicatorConfigNos.length > 2) {
      const macdData = computeMockMACD(candles);
      indicators.push({
        indicatorConfigNo: activeIndicatorConfigNos[2],
        indicatorType: 'MACD',
        displayName: 'MACD(12,26,9)',
        parameters: { fast: 12, slow: 26, signal: 9 },
        data: macdData,
      });
    }
  }

  return { candles, indicators, hasMore: false };
}

function computeMockRSI(candles: ChartCandle[], period: number): ChartIndicator['data'] {
  const closes = candles.map((c) => c.closePrice);
  const result: ChartIndicator['data'] = [];

  if (closes.length < period + 1) return result;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      const diff = closes[i] - closes[i - 1];
      avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    result.push({
      calculatedAt: candles[i].tradedAt,
      value: { rsi: +rsi.toFixed(2) },
    });
  }

  return result;
}

function computeMockMACD(candles: ChartCandle[]): ChartIndicator['data'] {
  const closes = candles.map((c) => c.closePrice);
  const result: ChartIndicator['data'] = [];

  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdLine.push(ema12[i]! - ema26[i]!);
    } else {
      macdLine.push(0);
    }
  }

  const signalLine = computeEMA(macdLine, 9);

  for (let i = 25; i < closes.length; i++) {
    const macd = macdLine[i];
    const signal = signalLine[i] ?? 0;
    result.push({
      calculatedAt: candles[i].tradedAt,
      value: {
        macd: +macd.toFixed(4),
        signal: +signal.toFixed(4),
        histogram: +(macd - signal).toFixed(4),
      },
    });
  }

  return result;
}

function computeEMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      const sum = values.slice(0, period).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    } else {
      const prev = result[i - 1]!;
      result.push((values[i] - prev) * multiplier + prev);
    }
  }

  return result;
}
