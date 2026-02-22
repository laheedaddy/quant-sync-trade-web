import type { VersionSnapshot, DeliveryMethod } from './strategy';

// ──────────────────────────────────────────────
// Delivery Method Config
// ──────────────────────────────────────────────

export type DeliveryMethodConfig =
  | { method: 'NOTIFICATION' }
  | { method: 'WEBHOOK'; webhookConfigNo: number }
  | { method: 'LOCAL_CLIENT' };

// ──────────────────────────────────────────────
// Webhook Config
// ──────────────────────────────────────────────

export interface WebhookConfig {
  webhookConfigNo: number;
  userNo: number;
  name: string;
  url: string;
  headers: Record<string, string> | null;
  isActive: boolean;
  consecutiveFailures: number;
  lastDeliveredAt: string | null;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Market Session
// ──────────────────────────────────────────────

export type MarketSession =
  | 'PRE_MARKET'
  | 'REGULAR'
  | 'AFTER_MARKET'
  | 'OVERNIGHT'
  | 'WEEKEND'
  | 'CRYPTO_24_7';

export const MARKET_SESSION_LABELS: Record<MarketSession, string> = {
  PRE_MARKET: 'Pre-Market',
  REGULAR: 'Regular Hours',
  AFTER_MARKET: 'After-Market',
  OVERNIGHT: 'Overnight',
  WEEKEND: 'Weekend',
  CRYPTO_24_7: 'Crypto 24/7',
};

// ──────────────────────────────────────────────
// Signal Channel types
// ──────────────────────────────────────────────

export interface SignalChannel {
  signalChannelNo: number;
  userNo: number;
  userStrategyNo: number;
  userStrategyVersionNo: number;
  title?: string;
  description?: string;
  symbol: string;
  timeframe: string;
  deliveryType: string;
  isAutoTrade: boolean;
  deliveryMethods?: DeliveryMethodConfig[];
  isConnected: boolean;
  isReceiving: boolean;
  lastSignalType: 'BUY' | 'SELL' | null;
  lastSignalAt: string | null;
  lastSignalPrice: number | null;
  versionSnapshot: VersionSnapshot;
  versionNumber?: number;
  strategyName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SignalChannelLog {
  signalChannelLogNo: number;
  signalChannelNo: number;
  signalType: 'BUY' | 'SELL';
  price: number;
  matchedRuleType: string;
  reason: Record<string, unknown> | null;
  evaluatedAt: string;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Channel State
// ──────────────────────────────────────────────

export type ChannelState = 'DISCONNECTED' | 'CONNECTED' | 'RECEIVING';

export function getChannelState(ch: SignalChannel): ChannelState {
  if (ch.isReceiving) return 'RECEIVING';
  if (ch.isConnected) return 'CONNECTED';
  return 'DISCONNECTED';
}

// ──────────────────────────────────────────────
// Channel Status (Detail Dialog)
// ──────────────────────────────────────────────

export interface ChannelIndicatorCache {
  indicatorType: string;
  displayName: string;
  paramHash: string;
  parameters: Record<string, unknown>;
  hasCacheData: boolean;
  values: Array<{ at: string; v: Record<string, unknown> }>;
}

export interface ChannelStatus {
  lastSignalType: string | null;
  lastSignalAt: string | null;
  lastSignalPrice: number | null;
  isInCooldown: boolean;
  cooldownSecondsRemaining: number;
  isEvalLocked: boolean;
  indicators: ChannelIndicatorCache[];
  marketSession: MarketSession;
  isQuoteAvailable: boolean;
  isCrypto: boolean;
}

// ──────────────────────────────────────────────
// Channel Monitor (Rule Evaluation Trace)
// ──────────────────────────────────────────────

export interface LeafConditionEval {
  type: 'THRESHOLD' | 'CROSS' | 'PRICE' | 'POSITION';
  passed: boolean;
  indicatorRef: number;
  field: string;
  operator: string;
  actualValue: number | null;
  targetValue: number | null;
  prevValue?: number | null;
  prevTargetValue?: number | null;
  offsetPercent?: number;
  rawValue?: number | null;
}

export interface ConditionGroupEval {
  logic: 'AND' | 'OR';
  passed: boolean;
  conditions: Array<ConditionGroupEval | LeafConditionEval>;
}

export interface RuleEvalResult {
  ruleNo: number;
  ruleType: 'BUY' | 'SELL';
  priority: number;
  passed: boolean;
  conditionTrace: ConditionGroupEval;
}

export interface ChannelMonitor {
  lastSignalType: string | null;
  lastSignalAt: string | null;
  lastSignalPrice: number | null;
  isInCooldown: boolean;
  cooldownSecondsRemaining: number;
  nextEvaluateRule: 'BUY' | 'SELL';
  indicators: ChannelIndicatorCache[];
  ruleEvaluations: RuleEvalResult[];
  marketSession: MarketSession;
  isQuoteAvailable: boolean;
  isCrypto: boolean;
}

// ──────────────────────────────────────────────
// Request types
// ──────────────────────────────────────────────

export interface CreateSignalChannelRequest {
  userStrategyVersionNo: number;
  title?: string;
  description?: string;
  symbol: string;
  timeframe: string;
  deliveryType?: string;
  isAutoTrade?: boolean;
  deliveryMethods?: DeliveryMethodConfig[];
}
