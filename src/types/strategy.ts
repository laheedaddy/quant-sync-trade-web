// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const INDICATOR_TYPES = ['MA', 'EMA', 'RSI', 'MACD', 'BOLLINGER', 'STOCHASTIC', 'DRAWING_CHANNEL'] as const;
export type IndicatorType = (typeof INDICATOR_TYPES)[number];

export const SIGNAL_RULE_TYPES = ['BUY', 'SELL'] as const;
export type SignalRuleType = (typeof SIGNAL_RULE_TYPES)[number];

export const DELIVERY_TYPES = ['NOTIFICATION', 'AUTO_TRADE', 'BOTH'] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];

export const TIMEFRAMES = ['1min', '5min', '15min', '30min', '1hour', '4hour', '1day'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const COMPARISON_OPERATORS = ['GT', 'GTE', 'LT', 'LTE', 'EQ', 'BETWEEN'] as const;
export type ComparisonOperator = (typeof COMPARISON_OPERATORS)[number];

export const CROSS_OPERATORS = ['CROSS_ABOVE', 'CROSS_BELOW'] as const;
export type CrossOperator = (typeof CROSS_OPERATORS)[number];

export const CONDITION_TYPES = ['THRESHOLD', 'CROSS', 'PRICE', 'POSITION'] as const;
export type ConditionType = (typeof CONDITION_TYPES)[number];

export const GROUP_OPERATORS = ['AND', 'OR'] as const;
export type GroupOperator = (typeof GROUP_OPERATORS)[number];

export const INDICATOR_INDEX_OPTIONS = [
  { value: 0, label: '현재' },
  { value: 1, label: '1봉 전' },
  { value: 2, label: '2봉 전' },
  { value: 3, label: '3봉 전' },
  { value: 4, label: '4봉 전' },
] as const;

export const PRICE_FIELDS = ['closePrice', 'openPrice', 'highPrice', 'lowPrice'] as const;
export type PriceField = (typeof PRICE_FIELDS)[number];

export const POSITION_FIELDS = ['changePercent', 'trailingPercent', 'highChangePercent', 'holdingMinutes'] as const;
export type PositionField = (typeof POSITION_FIELDS)[number];

export const VERSION_TYPES = ['MAJOR', 'MINOR'] as const;
export type VersionType = (typeof VERSION_TYPES)[number];

export const STRATEGY_LIMITS = {
  maxStrategies: 10,
  maxIndicators: 20,
  maxRulesPerType: 5,
  maxDepth: 3,
} as const;

// ──────────────────────────────────────────────
// Operator display labels
// ──────────────────────────────────────────────

export const COMPARISON_OPERATOR_LABELS: Record<ComparisonOperator, string> = {
  GT: '>',
  LT: '<',
  GTE: '>=',
  LTE: '<=',
  EQ: '=',
  BETWEEN: 'between',
};

export const CROSS_OPERATOR_LABELS: Record<CrossOperator, string> = {
  CROSS_ABOVE: 'Cross Above',
  CROSS_BELOW: 'Cross Below',
};

export const PRICE_FIELD_LABELS: Record<PriceField, string> = {
  closePrice: 'Close',
  openPrice: 'Open',
  highPrice: 'High',
  lowPrice: 'Low',
};

export const POSITION_FIELD_LABELS: Record<PositionField, string> = {
  changePercent: '수익률 %',
  trailingPercent: '고점 대비 %',
  highChangePercent: '최고 수익률 %',
  holdingMinutes: '보유 시간(분)',
};

// ──────────────────────────────────────────────
// Condition Tree types (matches backend exactly)
// ──────────────────────────────────────────────

export interface ThresholdCondition {
  type: 'THRESHOLD';
  indicatorRef: number | null;
  field: string;
  operator: ComparisonOperator;
  value: number | [number, number];
  index?: number; // 0~4, default 0 (0=최신 완성 캔들)
}

export interface CrossCondition {
  type: 'CROSS';
  indicatorRef: number | null;
  field: string;
  operator: CrossOperator | 'GT' | 'LT';
  targetRef: number | null;
  targetField: string | null;
  index?: number; // source 인덱스 0~4, default 0
  targetIndex?: number; // target 인덱스 0~4, default 0
}

export interface PriceCondition {
  type: 'PRICE';
  indicatorRef: number | null;
  field: string;
  operator: ComparisonOperator;
  priceField: PriceField;
  index?: number; // 0~4, default 0
}

export interface PositionCondition {
  type: 'POSITION';
  field: PositionField;
  operator: ComparisonOperator;
  value: number | [number, number];
}

export type LeafCondition = ThresholdCondition | CrossCondition | PriceCondition | PositionCondition;

export interface ConditionGroup {
  logic: GroupOperator;
  conditions: (ConditionGroup | LeafCondition)[];
}

export type Condition = ConditionGroup | LeafCondition;

// ──────────────────────────────────────────────
// Type guard
// ──────────────────────────────────────────────

export function isConditionGroup(c: Condition): c is ConditionGroup {
  return 'logic' in c && 'conditions' in c && !('type' in c);
}

// ──────────────────────────────────────────────
// Backend DTOs (response) — matches backend field names
// ──────────────────────────────────────────────

export interface GetUserStrategyDto {
  userStrategyNo: number;
  userNo: number;
  accountNo?: number;
  symbol: string;
  timeframe: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDelete: boolean;
  createdAt: string;
  createdBy: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface GetUserIndicatorConfigDto {
  userIndicatorConfigNo: number;
  userStrategyNo: number;
  indicatorType: string;
  displayName: string;
  parameters: Record<string, number>;
  paramHash: string;
  isActive: boolean;
  isDelete: boolean;
  createdAt: string;
  createdBy: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface GetUserSignalRuleDto {
  userSignalRuleNo: number;
  userStrategyNo: number;
  ruleType: SignalRuleType;
  conditions: ConditionGroup;
  priority: number;
  isActive: boolean;
  isDelete: boolean;
  createdAt: string;
  createdBy: number;
  updatedAt?: string;
  updatedBy?: number;
}

// ──────────────────────────────────────────────
// Request types
// ──────────────────────────────────────────────

export interface CreateStrategyRequest {
  name: string;
  description?: string;
  symbol: string;
  timeframe: string;
}

export interface UpdateStrategyRequest {
  name?: string;
  description?: string;
}

export interface CreateIndicatorRequest {
  indicatorType: IndicatorType;
  displayName: string;
  parameters: Record<string, number>;
}

export interface UpdateIndicatorRequest {
  displayName?: string;
  parameters?: Record<string, number>;
  isActive?: boolean;
}

export interface CreateRuleRequest {
  ruleType: SignalRuleType;
  priority?: number;
  conditions: ConditionGroup;
}

export interface UpdateRuleRequest {
  priority?: number;
  conditions?: ConditionGroup;
}

// ──────────────────────────────────────────────
// Strategy Version types
// ──────────────────────────────────────────────

export interface DrawingSnapshotItem {
  drawingType: string;
  points: { time: number; price: number }[];
  style: Record<string, unknown>;
}

export interface VersionSnapshot {
  strategyName: string;
  indicators: Array<{
    userIndicatorConfigNo: number;
    indicatorType: string;
    displayName: string;
    parameters: Record<string, number>;
    paramHash: string;
  }>;
  buyRules: Array<{
    userSignalRuleNo: number;
    conditions: Record<string, unknown>;
    priority: number;
  }>;
  sellRules: Array<{
    userSignalRuleNo: number;
    conditions: Record<string, unknown>;
    priority: number;
  }>;
  drawingSnapshots?: Record<string, DrawingSnapshotItem[]>;
}

export interface GetUserStrategyVersionDto {
  userStrategyVersionNo: number;
  userStrategyNo: number;
  userStrategyInstanceNo?: number;
  versionNumber: number;
  versionType: VersionType;
  description?: string;
  snapshot: VersionSnapshot;
  createdAt: string;
}

export interface CreateVersionRequest {
  description?: string;
  versionType?: VersionType;
}

// ──────────────────────────────────────────────
// Strategy Instance types
// ──────────────────────────────────────────────

export interface GetUserStrategyInstanceDto {
  userStrategyInstanceNo: number;
  userStrategyNo: number;
  symbol: string;
  timeframe: string;
  liveSnapshot: VersionSnapshot;
  isDelete: boolean;
  createdAt: string;
  updatedAt?: string;
}

