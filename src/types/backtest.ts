export interface StrategySnapshot {
  strategyName: string;
  timeframe: string;
  indicators: Array<{
    userIndicatorConfigNo?: number;
    indicatorType: string;
    displayName: string;
    parameters: Record<string, unknown>;
    paramHash?: string;
  }>;
  buyRules: Array<{
    conditions: Record<string, unknown>;
    priority: number;
  }>;
  sellRules: Array<{
    conditions: Record<string, unknown>;
    priority: number;
  }>;
}

export interface BacktestRun {
  backtestRunNo: number;
  userStrategyNo: number;
  userStrategyVersionNo?: number;
  userStrategyInstanceNo?: number;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  totalReturn: number;
  totalPnl: number;
  winRate: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  maxDrawdown: number;
  avgTradeDuration: number;
  status: string;
  errorMessage?: string;
  strategySnapshot?: StrategySnapshot;
  createdAt: string;
  trades?: BacktestTrade[];
}

export interface BacktestTrade {
  backtestTradeNo: number;
  tradeType: string;
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  returnPct?: number;
  entryRuleNo: number;
  exitRuleNo?: number;
}

// ─── 조건 평가 트레이스 타입 ───

export interface LeafConditionEval {
  type: 'THRESHOLD' | 'CROSS' | 'PRICE';
  passed: boolean;
  indicatorRef: number;
  field: string;
  operator: string;
  actualValue: number | null;
  targetValue: number | null;
  prevValue?: number | null;
  prevTargetValue?: number | null;
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

export interface BacktestConditionLog {
  backtestConditionLogNo: number;
  backtestRunNo: number;
  candleTimestamp: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  positionState: 'NONE' | 'HOLDING';
  evaluatedRuleType: 'BUY' | 'SELL';
  ruleResults: RuleEvalResult[];
  action: 'ENTRY' | 'EXIT' | null;
  actionRuleNo: number | null;
}

// ─── 요청 타입 ───

export interface RunBacktestRequest {
  symbol: string;
  timeframe?: string;
  startDate: string;
  endDate: string;
  initialCapital?: number;
  userStrategyVersionNo?: number;
  userStrategyInstanceNo?: number;
}
