// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const INDICATOR_TYPES = ['MA', 'EMA', 'RSI', 'MACD', 'BOLLINGER', 'STOCHASTIC'] as const;
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

export const CONDITION_TYPES = ['THRESHOLD', 'CROSS', 'PRICE'] as const;
export type ConditionType = (typeof CONDITION_TYPES)[number];

export const GROUP_OPERATORS = ['AND', 'OR'] as const;
export type GroupOperator = (typeof GROUP_OPERATORS)[number];

export const PRICE_FIELDS = ['closePrice', 'openPrice', 'highPrice', 'lowPrice'] as const;
export type PriceField = (typeof PRICE_FIELDS)[number];

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

// ──────────────────────────────────────────────
// Condition Tree types (matches backend exactly)
// ──────────────────────────────────────────────

export interface ThresholdCondition {
  type: 'THRESHOLD';
  indicatorRef: number | null;
  field: string;
  operator: ComparisonOperator;
  value: number | [number, number];
}

export interface CrossCondition {
  type: 'CROSS';
  indicatorRef: number | null;
  field: string;
  operator: CrossOperator | 'GT' | 'LT';
  targetRef: number | null;
  targetField: string | null;
}

export interface PriceCondition {
  type: 'PRICE';
  indicatorRef: number | null;
  field: string;
  operator: ComparisonOperator;
  priceField: PriceField;
}

export type LeafCondition = ThresholdCondition | CrossCondition | PriceCondition;

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
  name: string;
  description?: string;
  symbols: string[];
  timeframe: string;
  deliveryType: string;
  isActive: boolean;
  isAutoTrade: boolean;
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
  symbols: string[];
  timeframe?: Timeframe;
  deliveryType?: DeliveryType;
  isAutoTrade?: boolean;
}

export interface UpdateStrategyRequest {
  name?: string;
  description?: string;
  symbols?: string[];
  timeframe?: Timeframe;
  deliveryType?: DeliveryType;
  isAutoTrade?: boolean;
}

export interface CreateIndicatorRequest {
  indicatorType: IndicatorType;
  displayName: string;
  parameters: Record<string, number>;
}

export interface UpdateIndicatorRequest {
  displayName?: string;
  parameters?: Record<string, number>;
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
