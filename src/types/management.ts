// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const EXCHANGES = ['NASDAQ', 'NYSE', 'AMEX', 'KRX', 'KOSPI', 'KOSDAQ', 'BINANCE'] as const;
export type Exchange = (typeof EXCHANGES)[number];

// ──────────────────────────────────────────────
// Stock
// ──────────────────────────────────────────────

export interface Stock {
  stockNo: number;
  fmpSymbol: string | null;
  isin: string | null;
  cik: string | null;
  symbol: string;
  stockName: string;
  exchange: string;
  exchangeShortName: string;
  stockType: string;
  isActive: boolean;
  isCollectionActive: boolean;
  isDelete: boolean;
  createdAt: string;
  createdBy: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface CreateStockRequest {
  symbol: string;
  stockName: string;
  exchange: string;
  exchangeShortName: string;
  stockType: string;
  fmpSymbol?: string | null;
  isin?: string | null;
}

export interface UpdateStockRequest {
  isActive?: boolean;
  isCollectionActive?: boolean;
}

export interface BackfillRequest {
  from: string;
  to?: string;
}

export interface BackfillResult {
  symbol: string;
  from: string;
  to: string;
  timeframeResults: Record<string, number>;
  totalCollected: number;
}
