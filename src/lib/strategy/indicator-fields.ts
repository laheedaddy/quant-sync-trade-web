import type { IndicatorType } from '@/types/strategy';

export interface IndicatorField {
  key: string;
  label: string;
}

const INDICATOR_FIELDS: Record<IndicatorType, IndicatorField[]> = {
  MA: [{ key: 'value', label: 'Value' }],
  EMA: [{ key: 'value', label: 'Value' }],
  RSI: [{ key: 'value', label: 'Value' }],
  MACD: [
    { key: 'macd', label: 'MACD' },
    { key: 'signal', label: 'Signal' },
    { key: 'histogram', label: 'Histogram' },
  ],
  BOLLINGER: [
    { key: 'upper', label: 'Upper' },
    { key: 'middle', label: 'Middle' },
    { key: 'lower', label: 'Lower' },
    { key: 'bandwidth', label: 'Bandwidth' },
    { key: 'bandwidthPercentile', label: 'BW Percentile' },
    { key: 'bandwidthSma', label: 'BW SMA' },
    { key: 'bandwidthRatio', label: 'BW Ratio' },
  ],
  STOCHASTIC: [
    { key: 'k', label: '%K' },
    { key: 'd', label: '%D' },
  ],
  DRAWING_CHANNEL: [
    { key: 'upper', label: 'Upper' },
    { key: 'middle', label: 'Middle' },
    { key: 'lower', label: 'Lower' },
  ],
  ADX: [
    { key: 'adx', label: 'ADX' },
    { key: 'pdi', label: '+DI' },
    { key: 'mdi', label: '-DI' },
  ],
  SUPERTREND: [
    { key: 'value', label: 'Value' },
    { key: 'direction', label: 'Direction' },
  ],
  ICHIMOKU: [
    { key: 'tenkan', label: 'Tenkan' },
    { key: 'kijun', label: 'Kijun' },
    { key: 'senkouA', label: 'Senkou A' },
    { key: 'senkouB', label: 'Senkou B' },
    { key: 'chikou', label: 'Chikou' },
  ],
  CCI: [{ key: 'value', label: 'Value' }],
  ROC: [{ key: 'value', label: 'Value' }],
  ATR: [{ key: 'value', label: 'Value' }],
  KELTNER: [
    { key: 'upper', label: 'Upper' },
    { key: 'middle', label: 'Middle' },
    { key: 'lower', label: 'Lower' },
  ],
  DONCHIAN: [
    { key: 'upper', label: 'Upper' },
    { key: 'middle', label: 'Middle' },
    { key: 'lower', label: 'Lower' },
  ],
  OBV: [{ key: 'value', label: 'Value' }],
  VWAP: [{ key: 'value', label: 'Value' }],
  PIVOT: [
    { key: 'pp', label: 'PP' },
    { key: 'r1', label: 'R1' },
    { key: 'r2', label: 'R2' },
    { key: 'r3', label: 'R3' },
    { key: 's1', label: 'S1' },
    { key: 's2', label: 'S2' },
    { key: 's3', label: 'S3' },
  ],
  PSAR: [{ key: 'value', label: 'Value' }],
  TREND_SCORE: [
    { key: 'score', label: 'Score' },
    { key: 'maScore', label: 'MA Score' },
    { key: 'slopeScore', label: 'Slope Score' },
    { key: 'adxScore', label: 'ADX Score' },
    { key: 'breakoutScore', label: 'Breakout Score' },
    { key: 'volumeScore', label: 'Volume Score' },
  ],
};

export function getIndicatorFields(type: IndicatorType): IndicatorField[] {
  return INDICATOR_FIELDS[type] ?? [];
}

export function getDefaultField(type: IndicatorType): string {
  const fields = getIndicatorFields(type);
  return fields[0]?.key ?? '';
}

// Indicator parameter definitions for dynamic forms
export interface IndicatorParamDef {
  key: string;
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
}

const INDICATOR_PARAM_DEFS: Record<IndicatorType, IndicatorParamDef[]> = {
  MA: [{ key: 'period', label: 'Period', defaultValue: 20, min: 1, max: 500 }],
  EMA: [{ key: 'period', label: 'Period', defaultValue: 12, min: 1, max: 500 }],
  RSI: [{ key: 'period', label: 'Period', defaultValue: 14, min: 1, max: 500 }],
  MACD: [
    { key: 'fastPeriod', label: 'Fast Period', defaultValue: 12, min: 1, max: 500 },
    { key: 'slowPeriod', label: 'Slow Period', defaultValue: 26, min: 1, max: 500 },
    { key: 'signalPeriod', label: 'Signal Period', defaultValue: 9, min: 1, max: 500 },
  ],
  BOLLINGER: [
    { key: 'period', label: 'Period', defaultValue: 20, min: 1, max: 500 },
    { key: 'deviation', label: 'Deviation', defaultValue: 2, min: 0.1, max: 10 },
    { key: 'bandwidthLookback', label: 'BW Lookback', defaultValue: 20, min: 5, max: 500 },
  ],
  STOCHASTIC: [
    { key: 'kPeriod', label: '%K Period', defaultValue: 14, min: 1, max: 500 },
    { key: 'dPeriod', label: '%D Period', defaultValue: 3, min: 1, max: 500 },
  ],
  DRAWING_CHANNEL: [],
  ADX: [{ key: 'period', label: 'Period', defaultValue: 14, min: 1, max: 500 }],
  SUPERTREND: [
    { key: 'period', label: 'Period', defaultValue: 10, min: 1, max: 500 },
    { key: 'multiplier', label: 'Multiplier', defaultValue: 3, min: 0.1, max: 10 },
  ],
  ICHIMOKU: [
    { key: 'tenkanPeriod', label: 'Tenkan Period', defaultValue: 9, min: 1, max: 500 },
    { key: 'kijunPeriod', label: 'Kijun Period', defaultValue: 26, min: 1, max: 500 },
    { key: 'senkouBPeriod', label: 'Senkou B Period', defaultValue: 52, min: 1, max: 500 },
  ],
  CCI: [{ key: 'period', label: 'Period', defaultValue: 20, min: 1, max: 500 }],
  ROC: [{ key: 'period', label: 'Period', defaultValue: 12, min: 1, max: 500 }],
  ATR: [{ key: 'period', label: 'Period', defaultValue: 14, min: 1, max: 500 }],
  KELTNER: [
    { key: 'period', label: 'Period', defaultValue: 20, min: 1, max: 500 },
    { key: 'multiplier', label: 'Multiplier', defaultValue: 1.5, min: 0.1, max: 10 },
  ],
  DONCHIAN: [{ key: 'period', label: 'Period', defaultValue: 20, min: 1, max: 500 }],
  OBV: [],
  VWAP: [],
  PIVOT: [],
  PSAR: [
    { key: 'step', label: 'Step', defaultValue: 0.02, min: 0.001, max: 0.5 },
    { key: 'maxStep', label: 'Max Step', defaultValue: 0.2, min: 0.01, max: 1 },
  ],
  TREND_SCORE: [
    { key: 'shortMa', label: 'Short MA', defaultValue: 20, min: 5, max: 100 },
    { key: 'midMa', label: 'Mid MA', defaultValue: 60, min: 20, max: 200 },
    { key: 'longMa', label: 'Long MA', defaultValue: 200, min: 50, max: 500 },
  ],
};

export function getIndicatorParamDefs(type: IndicatorType): IndicatorParamDef[] {
  return INDICATOR_PARAM_DEFS[type] ?? [];
}

export function getDefaultParams(type: IndicatorType): Record<string, number> {
  const defs = getIndicatorParamDefs(type);
  const params: Record<string, number> = {};
  for (const def of defs) {
    params[def.key] = def.defaultValue;
  }
  return params;
}

export function getIndicatorLabel(type: IndicatorType, params: Record<string, number>): string {
  if (type === 'DRAWING_CHANNEL') {
    return `Channel #${params.userChartDrawingNo ?? '?'}`;
  }
  const values = Object.values(params);
  return values.length > 0 ? `${type}(${values.join(',')})` : type;
}

// ──────────────────────────────────────────────
// Indicator Category (기본 지표 / 복합 지표)
// ──────────────────────────────────────────────

export const INDICATOR_CATEGORY = {
  STANDARD: 'STANDARD',
  COMPOSITE: 'COMPOSITE',
} as const;

export type IndicatorCategory = (typeof INDICATOR_CATEGORY)[keyof typeof INDICATOR_CATEGORY];

export const COMPOSITE_INDICATOR_TYPES: IndicatorType[] = ['TREND_SCORE'];

export function getIndicatorCategory(type: IndicatorType): IndicatorCategory {
  return COMPOSITE_INDICATOR_TYPES.includes(type)
    ? INDICATOR_CATEGORY.COMPOSITE
    : INDICATOR_CATEGORY.STANDARD;
}

export const INDICATOR_CATEGORY_LABELS: Record<IndicatorCategory, string> = {
  STANDARD: '기본 지표',
  COMPOSITE: '복합 지표',
};
