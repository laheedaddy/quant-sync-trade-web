import type { IndicatorType } from '@/types/chart';
import { INDICATOR_COLORS } from './theme';

export interface IndicatorSeriesConfig {
  type: 'overlay' | 'panel';
  panelLabel?: string;
  series: {
    key: string;
    color: string;
    lineWidth?: number;
    seriesType: 'line' | 'histogram';
    priceScaleId?: string;
  }[];
  referenceLines?: { value: number; color: string; label: string }[];
  /** Keys to display in the panel legend (defaults to series keys if omitted) */
  legendKeys?: string[];
}

export function getIndicatorSeriesConfig(
  indicatorType: IndicatorType,
  customColors?: Record<string, string> | null,
  customLineWidths?: Record<string, number> | null,
): IndicatorSeriesConfig {
  const config = _getBaseIndicatorSeriesConfig(indicatorType);
  if (customColors) {
    for (const s of config.series) {
      if (customColors[s.key]) s.color = customColors[s.key];
    }
  }
  if (customLineWidths) {
    for (const s of config.series) {
      if (customLineWidths[s.key] != null) s.lineWidth = customLineWidths[s.key];
    }
  }
  return config;
}

function _getBaseIndicatorSeriesConfig(indicatorType: IndicatorType): IndicatorSeriesConfig {
  switch (indicatorType) {
    case 'MA':
      return {
        type: 'overlay',
        series: [
          { key: 'value', color: INDICATOR_COLORS.MA, lineWidth: 1, seriesType: 'line' },
        ],
      };

    case 'EMA':
      return {
        type: 'overlay',
        series: [
          { key: 'value', color: INDICATOR_COLORS.EMA, lineWidth: 1, seriesType: 'line' },
        ],
      };

    case 'BOLLINGER':
      return {
        type: 'overlay',
        series: [
          { key: 'upper', color: INDICATOR_COLORS.BOLLINGER_UPPER, lineWidth: 1, seriesType: 'line' },
          { key: 'middle', color: INDICATOR_COLORS.BOLLINGER_MIDDLE, lineWidth: 1, seriesType: 'line' },
          { key: 'lower', color: INDICATOR_COLORS.BOLLINGER_LOWER, lineWidth: 1, seriesType: 'line' },
        ],
      };

    case 'RSI':
      return {
        type: 'panel',
        panelLabel: 'RSI',
        series: [
          { key: 'value', color: INDICATOR_COLORS.RSI, lineWidth: 1, seriesType: 'line' },
        ],
        referenceLines: [
          { value: 70, color: '#ef535080', label: 'Overbought' },
          { value: 30, color: '#26a69a80', label: 'Oversold' },
        ],
      };

    case 'MACD':
      return {
        type: 'panel',
        panelLabel: 'MACD',
        series: [
          { key: 'macd', color: INDICATOR_COLORS.MACD_LINE, lineWidth: 1, seriesType: 'line' },
          { key: 'signal', color: INDICATOR_COLORS.MACD_SIGNAL, lineWidth: 1, seriesType: 'line' },
          {
            key: 'histogram',
            color: INDICATOR_COLORS.MACD_HISTOGRAM_POSITIVE,
            seriesType: 'histogram',
            priceScaleId: 'macd-histogram',
          },
        ],
      };

    case 'STOCHASTIC':
      return {
        type: 'panel',
        panelLabel: 'Stochastic',
        series: [
          { key: 'k', color: INDICATOR_COLORS.STOCHASTIC_K, lineWidth: 1, seriesType: 'line' },
          { key: 'd', color: INDICATOR_COLORS.STOCHASTIC_D, lineWidth: 1, seriesType: 'line' },
        ],
        referenceLines: [
          { value: 80, color: '#ef535080', label: 'Overbought' },
          { value: 20, color: '#26a69a80', label: 'Oversold' },
        ],
      };

    case 'ADX':
      return {
        type: 'panel',
        panelLabel: 'ADX',
        series: [
          { key: 'adx', color: INDICATOR_COLORS.ADX, lineWidth: 1, seriesType: 'line' },
          { key: 'pdi', color: INDICATOR_COLORS.ADX_PDI, lineWidth: 1, seriesType: 'line' },
          { key: 'mdi', color: INDICATOR_COLORS.ADX_MDI, lineWidth: 1, seriesType: 'line' },
        ],
        referenceLines: [
          { value: 25, color: '#78909c80', label: 'Trend' },
        ],
      };

    case 'SUPERTREND':
      return {
        type: 'overlay',
        series: [
          { key: 'value', color: INDICATOR_COLORS.SUPERTREND, lineWidth: 1, seriesType: 'line' },
        ],
      };

    case 'ICHIMOKU':
      return {
        type: 'overlay',
        series: [
          { key: 'tenkan', color: INDICATOR_COLORS.ICHIMOKU_TENKAN, lineWidth: 1, seriesType: 'line' },
          { key: 'kijun', color: INDICATOR_COLORS.ICHIMOKU_KIJUN, lineWidth: 1, seriesType: 'line' },
          { key: 'senkouA', color: INDICATOR_COLORS.ICHIMOKU_SENKOU_A, lineWidth: 1, seriesType: 'line' },
          { key: 'senkouB', color: INDICATOR_COLORS.ICHIMOKU_SENKOU_B, lineWidth: 1, seriesType: 'line' },
          { key: 'chikou', color: INDICATOR_COLORS.ICHIMOKU_CHIKOU, lineWidth: 1, seriesType: 'line' },
        ],
      };

    case 'CCI':
      return {
        type: 'panel',
        panelLabel: 'CCI',
        series: [
          { key: 'value', color: INDICATOR_COLORS.CCI, lineWidth: 1, seriesType: 'line' },
        ],
        referenceLines: [
          { value: 100, color: '#ef535080', label: 'Overbought' },
          { value: -100, color: '#26a69a80', label: 'Oversold' },
        ],
      };

    case 'ROC':
      return {
        type: 'panel',
        panelLabel: 'ROC',
        series: [
          { key: 'value', color: INDICATOR_COLORS.ROC, lineWidth: 1, seriesType: 'line' },
        ],
        referenceLines: [
          { value: 0, color: '#78909c80', label: 'Zero' },
        ],
      };

    case 'ATR':
      return {
        type: 'panel',
        panelLabel: 'ATR',
        series: [
          { key: 'value', color: INDICATOR_COLORS.ATR, lineWidth: 1, seriesType: 'line' },
        ],
      };

    case 'KELTNER':
      return {
        type: 'overlay',
        series: [
          { key: 'upper', color: INDICATOR_COLORS.KELTNER_UPPER, lineWidth: 1, seriesType: 'line' },
          { key: 'middle', color: INDICATOR_COLORS.KELTNER_MIDDLE, lineWidth: 1, seriesType: 'line' },
          { key: 'lower', color: INDICATOR_COLORS.KELTNER_LOWER, lineWidth: 1, seriesType: 'line' },
        ],
      };

    case 'DONCHIAN':
      return {
        type: 'overlay',
        series: [
          { key: 'upper', color: INDICATOR_COLORS.DONCHIAN_UPPER, lineWidth: 1, seriesType: 'line' },
          { key: 'middle', color: INDICATOR_COLORS.DONCHIAN_MIDDLE, lineWidth: 1, seriesType: 'line' },
          { key: 'lower', color: INDICATOR_COLORS.DONCHIAN_LOWER, lineWidth: 1, seriesType: 'line' },
        ],
      };

    case 'OBV':
      return {
        type: 'panel',
        panelLabel: 'OBV',
        series: [
          { key: 'value', color: INDICATOR_COLORS.OBV, lineWidth: 1, seriesType: 'line' },
        ],
      };

    case 'VWAP':
      return {
        type: 'overlay',
        series: [
          { key: 'value', color: INDICATOR_COLORS.VWAP, lineWidth: 2, seriesType: 'line' },
        ],
      };

    case 'PIVOT':
      return {
        type: 'overlay',
        series: [
          { key: 'pp', color: INDICATOR_COLORS.PIVOT_PP, lineWidth: 1, seriesType: 'line' },
          { key: 'r1', color: INDICATOR_COLORS.PIVOT_R1, lineWidth: 1, seriesType: 'line' },
          { key: 'r2', color: INDICATOR_COLORS.PIVOT_R2, lineWidth: 1, seriesType: 'line' },
          { key: 'r3', color: INDICATOR_COLORS.PIVOT_R3, lineWidth: 1, seriesType: 'line' },
          { key: 's1', color: INDICATOR_COLORS.PIVOT_S1, lineWidth: 1, seriesType: 'line' },
          { key: 's2', color: INDICATOR_COLORS.PIVOT_S2, lineWidth: 1, seriesType: 'line' },
          { key: 's3', color: INDICATOR_COLORS.PIVOT_S3, lineWidth: 1, seriesType: 'line' },
        ],
      };

    case 'PSAR':
      return {
        type: 'overlay',
        series: [
          { key: 'value', color: INDICATOR_COLORS.PSAR, lineWidth: 1, seriesType: 'line' },
        ],
      };

    case 'TREND_SCORE':
      return {
        type: 'panel',
        panelLabel: 'Trend Score',
        series: [
          { key: 'score', color: INDICATOR_COLORS.TREND_SCORE, lineWidth: 2, seriesType: 'line' },
        ],
        referenceLines: [
          { value: 70, color: '#26a69a80', label: 'Strong' },
          { value: 30, color: '#ef535080', label: 'Weak' },
        ],
        legendKeys: ['score', 'maScore', 'slopeScore', 'adxScore', 'breakoutScore', 'volumeScore'],
      };

    default:
      return { type: 'overlay', series: [] };
  }
}

export function isOverlayIndicator(type: string): boolean {
  return ['MA', 'EMA', 'BOLLINGER', 'SUPERTREND', 'ICHIMOKU', 'KELTNER', 'DONCHIAN', 'VWAP', 'PIVOT', 'PSAR'].includes(type);
}

export function isPanelIndicator(type: string): boolean {
  return ['RSI', 'MACD', 'STOCHASTIC', 'ADX', 'CCI', 'ROC', 'ATR', 'OBV', 'TREND_SCORE'].includes(type);
}
