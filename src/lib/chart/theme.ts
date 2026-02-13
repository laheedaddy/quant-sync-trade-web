import type { DeepPartial, ChartOptions } from 'lightweight-charts';
import { ColorType } from 'lightweight-charts';

export const CHART_COLORS = {
  background: '#0a0e17',
  backgroundSecondary: '#131722',
  text: '#d1d4dc',
  textMuted: '#787b86',
  grid: '#1e222d',
  border: '#2a2e39',
  crosshair: '#555b66',
  bullish: '#26a69a',
  bearish: '#ef5350',
  volume: 'rgba(76, 175, 80, 0.3)',
  volumeBear: 'rgba(239, 83, 80, 0.3)',
} as const;

export const INDICATOR_COLORS = {
  MA: '#2196F3',
  EMA: '#FFD54F',
  BOLLINGER_UPPER: '#9C27B0',
  BOLLINGER_MIDDLE: '#BA68C8',
  BOLLINGER_LOWER: '#9C27B0',
  RSI: '#4CAF50',
  MACD_LINE: '#2196F3',
  MACD_SIGNAL: '#FF5722',
  MACD_HISTOGRAM_POSITIVE: 'rgba(76, 175, 80, 0.6)',
  MACD_HISTOGRAM_NEGATIVE: 'rgba(239, 83, 80, 0.6)',
  STOCHASTIC_K: '#FF9800',
  STOCHASTIC_D: '#03A9F4',
} as const;

export function createChartTheme(): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: { type: ColorType.Solid, color: CHART_COLORS.background },
      textColor: CHART_COLORS.text,
      fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
      fontSize: 11,
    },
    grid: {
      vertLines: { color: CHART_COLORS.grid },
      horzLines: { color: CHART_COLORS.grid },
    },
    crosshair: {
      vertLine: {
        color: CHART_COLORS.crosshair,
        width: 1,
        style: 2,
        labelBackgroundColor: CHART_COLORS.backgroundSecondary,
      },
      horzLine: {
        color: CHART_COLORS.crosshair,
        width: 1,
        style: 2,
        labelBackgroundColor: CHART_COLORS.backgroundSecondary,
      },
    },
    rightPriceScale: {
      borderColor: CHART_COLORS.border,
      scaleMargins: { top: 0.1, bottom: 0.2 },
    },
    timeScale: {
      borderColor: CHART_COLORS.border,
      timeVisible: true,
      secondsVisible: false,
    },
  };
}

export function createPanelChartTheme(): DeepPartial<ChartOptions> {
  return {
    ...createChartTheme(),
    rightPriceScale: {
      borderColor: CHART_COLORS.border,
      scaleMargins: { top: 0.1, bottom: 0.1 },
    },
    timeScale: {
      borderColor: CHART_COLORS.border,
      timeVisible: true,
      secondsVisible: false,
      visible: false,
    },
  };
}
