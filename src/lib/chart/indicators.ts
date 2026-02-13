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
}

export function getIndicatorSeriesConfig(indicatorType: IndicatorType): IndicatorSeriesConfig {
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

    default:
      return { type: 'overlay', series: [] };
  }
}

export function isOverlayIndicator(type: string): boolean {
  return ['MA', 'EMA', 'BOLLINGER'].includes(type);
}

export function isPanelIndicator(type: string): boolean {
  return ['RSI', 'MACD', 'STOCHASTIC'].includes(type);
}
