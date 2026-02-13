export interface ChartCandle {
  tradedAt: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
}

export interface ChartIndicatorData {
  calculatedAt: string;
  value: Record<string, unknown>;
}

export interface ChartIndicator {
  indicatorConfigNo: number;
  indicatorType: string;
  displayName: string;
  parameters: Record<string, unknown>;
  data: ChartIndicatorData[];
}

export interface ChartResponse {
  candles: ChartCandle[];
  indicators: ChartIndicator[];
  hasMore: boolean;
}

export interface IndicatorConfig {
  indicatorConfigNo: number;
  indicatorType: string;
  displayName: string;
  parameters: Record<string, unknown>;
  timeframe: string;
}

export type IndicatorType = 'MA' | 'EMA' | 'RSI' | 'MACD' | 'BOLLINGER' | 'STOCHASTIC';

export type Timeframe = '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour' | '1day';

export type OverlayIndicator = 'MA' | 'EMA' | 'BOLLINGER';
export type PanelIndicator = 'RSI' | 'MACD' | 'STOCHASTIC';

export const OVERLAY_INDICATORS: OverlayIndicator[] = ['MA', 'EMA', 'BOLLINGER'];
export const PANEL_INDICATORS: PanelIndicator[] = ['RSI', 'MACD', 'STOCHASTIC'];

export const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1m', value: '1min' },
  { label: '5m', value: '5min' },
  { label: '15m', value: '15min' },
  { label: '30m', value: '30min' },
  { label: '1H', value: '1hour' },
  { label: '4H', value: '4hour' },
  { label: '1D', value: '1day' },
];
