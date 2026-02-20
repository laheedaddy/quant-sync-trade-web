export interface ChartCandle {
  tradedAt: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  isForming?: boolean;
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
  drawingSnapshots?: Record<string, import('@/types/strategy').DrawingSnapshotItem[]>;
}

export interface IndicatorConfig {
  indicatorConfigNo: number;
  indicatorType: string;
  displayName: string;
  parameters: Record<string, unknown>;
  timeframe: string;
}

export interface UserChartIndicatorConfig {
  userChartIndicatorConfigNo: number;
  userNo: number;
  symbol: string;
  timeframe: string;
  indicatorType: string;
  displayName: string;
  parameters: Record<string, unknown>;
  paramHash: string;
  colors?: Record<string, string> | null;
  lineWidths?: Record<string, number> | null;
  isActive: boolean;
  isDelete: boolean;
  createdAt: string;
  createdBy: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface CreateChartIndicatorRequest {
  indicatorType: string;
  displayName: string;
  parameters: Record<string, unknown>;
  colors?: Record<string, string> | null;
  lineWidths?: Record<string, number> | null;
}

export interface UpdateChartIndicatorRequest {
  displayName?: string;
  parameters?: Record<string, unknown>;
  isActive?: boolean;
  colors?: Record<string, string> | null;
  lineWidths?: Record<string, number> | null;
}

export type IndicatorType = 'MA' | 'EMA' | 'RSI' | 'MACD' | 'BOLLINGER' | 'STOCHASTIC' | 'ADX' | 'SUPERTREND' | 'ICHIMOKU' | 'CCI' | 'ROC' | 'ATR' | 'KELTNER' | 'DONCHIAN' | 'OBV' | 'VWAP' | 'PIVOT' | 'PSAR' | 'TREND_SCORE';

export type Timeframe = '1min' | '3min' | '5min' | '10min' | '15min' | '30min' | '1hour' | '4hour' | '1day' | '1week' | '1month' | '1year';

export type OverlayIndicator = 'MA' | 'EMA' | 'BOLLINGER' | 'SUPERTREND' | 'ICHIMOKU' | 'KELTNER' | 'DONCHIAN' | 'VWAP' | 'PIVOT' | 'PSAR';
export type PanelIndicator = 'RSI' | 'MACD' | 'STOCHASTIC' | 'ADX' | 'CCI' | 'ROC' | 'ATR' | 'OBV' | 'TREND_SCORE';

export const OVERLAY_INDICATORS: OverlayIndicator[] = ['MA', 'EMA', 'BOLLINGER', 'SUPERTREND', 'ICHIMOKU', 'KELTNER', 'DONCHIAN', 'VWAP', 'PIVOT', 'PSAR'];
export const PANEL_INDICATORS: PanelIndicator[] = ['RSI', 'MACD', 'STOCHASTIC', 'ADX', 'CCI', 'ROC', 'ATR', 'OBV', 'TREND_SCORE'];

export const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1m', value: '1min' },
  { label: '3m', value: '3min' },
  { label: '5m', value: '5min' },
  { label: '10m', value: '10min' },
  { label: '15m', value: '15min' },
  { label: '30m', value: '30min' },
  { label: '1H', value: '1hour' },
  { label: '4H', value: '4hour' },
  { label: '1D', value: '1day' },
  { label: '1W', value: '1week' },
  { label: '1M', value: '1month' },
  { label: '1Y', value: '1year' },
];

// ── Drawing types ──

export interface DrawingPoint {
  time: number;
  price: number;
}

export interface DrawingStyle {
  lineColor?: string;
  lineWidth?: number;
  fillColor?: string;
  fillOpacity?: number;
  extendLeft?: boolean;
  extendRight?: boolean;
  priceScaleMode?: PriceScaleMode; // 0=Normal, 1=Logarithmic (for backend channel calculation)
  dashed?: boolean;         // Horizontal line dashed style
  showPriceLabel?: boolean; // Horizontal line price label on right
}

export type DrawingType = 'PARALLEL_CHANNEL' | 'RAY' | 'HORIZONTAL_LINE';

export type DrawingToolMode = 'none' | 'parallel_channel' | 'ray' | 'horizontal_line';

export type CandleDisplayType = 'candles' | 'heikin_ashi' | 'line' | 'area';
export type PriceScaleMode = 0 | 1; // 0=Normal, 1=Logarithmic

export type ChartMode = 'default' | 'strategy';

export interface ChartSettings {
  userChartSettingsNo: number;
  candleDisplayType: CandleDisplayType;
  priceScaleMode: PriceScaleMode;
  showReferenceLines: boolean;
}

export interface UpdateChartSettingsRequest {
  candleDisplayType?: CandleDisplayType;
  priceScaleMode?: PriceScaleMode;
  showReferenceLines?: boolean;
}

export interface UserChartDrawing {
  userChartDrawingNo: number;
  userNo: number;
  symbol: string;
  timeframe: string;
  userStrategyNo: number;
  drawingType: DrawingType;
  points: DrawingPoint[];
  style: DrawingStyle;
  isDelete: boolean;
  createdAt: string;
  createdBy: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface CreateChartDrawingRequest {
  drawingType: DrawingType;
  points: DrawingPoint[];
  style: DrawingStyle;
}

export interface UpdateChartDrawingRequest {
  points?: DrawingPoint[];
  style?: DrawingStyle;
}
