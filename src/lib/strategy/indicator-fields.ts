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
  ],
  STOCHASTIC: [
    { key: 'k', label: '%K' },
    { key: 'd', label: '%D' },
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
  ],
  STOCHASTIC: [
    { key: 'kPeriod', label: '%K Period', defaultValue: 14, min: 1, max: 500 },
    { key: 'dPeriod', label: '%D Period', defaultValue: 3, min: 1, max: 500 },
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
  const values = Object.values(params);
  return values.length > 0 ? `${type}(${values.join(',')})` : type;
}
