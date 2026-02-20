import type { DeepPartial, ChartOptions } from 'lightweight-charts';
import { ColorType, CrosshairMode } from 'lightweight-charts';

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
  ADX: '#E91E63',
  ADX_PDI: '#4CAF50',
  ADX_MDI: '#F44336',
  SUPERTREND: '#00BCD4',
  ICHIMOKU_TENKAN: '#2196F3',
  ICHIMOKU_KIJUN: '#F44336',
  ICHIMOKU_SENKOU_A: 'rgba(76, 175, 80, 0.5)',
  ICHIMOKU_SENKOU_B: 'rgba(239, 83, 80, 0.5)',
  ICHIMOKU_CHIKOU: '#9C27B0',
  CCI: '#FF9800',
  ROC: '#00BCD4',
  ATR: '#795548',
  KELTNER_UPPER: '#26A69A',
  KELTNER_MIDDLE: '#4DB6AC',
  KELTNER_LOWER: '#26A69A',
  DONCHIAN_UPPER: '#42A5F5',
  DONCHIAN_MIDDLE: '#90CAF9',
  DONCHIAN_LOWER: '#42A5F5',
  OBV: '#7E57C2',
  VWAP: '#FF7043',
  PIVOT_PP: '#FFD54F',
  PIVOT_R1: '#EF5350',
  PIVOT_R2: '#E53935',
  PIVOT_R3: '#C62828',
  PIVOT_S1: '#26A69A',
  PIVOT_S2: '#00897B',
  PIVOT_S3: '#00695C',
  PSAR: '#E040FB',
  TREND_SCORE: '#FF6F00',
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
      mode: CrosshairMode.Normal,
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
