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
  sector: string | null;
  industry: string | null;
  country: string | null;
  description: string | null;
  mktCap: number | null;
  currency: string | null;
  website: string | null;
  logoUrl: string | null;
  ipoDate: string | null;
  fullTimeEmployees: number | null;
  isEtf: boolean;
  isAdr: boolean;
  stockNameLocal: string | null;
  tags: string | null;
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
  minTradedAt: string | null;
  maxTradedAt: string | null;
}

export interface StockQuery {
  offset?: number;
  limit?: number;
  keyword?: string;
  isDelete?: boolean;
  isActive?: boolean;
  isCollectionActive?: boolean;
  exchange?: string;
  stockType?: string;
}

export interface UpdateStockRequest {
  isActive?: boolean;
  isCollectionActive?: boolean;
  stockNameLocal?: string | null;
  tags?: string | null;
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

// ──────────────────────────────────────────────
// FMP Search / Bulk Register
// ──────────────────────────────────────────────

export interface FmpSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  exchangeShortName?: string;
  sector?: string;
  isRegistered: boolean;
}

export type FmpIndex = 'sp500' | 'nasdaq' | 'dowjones';

export interface BulkRegisterItem {
  symbol: string;
  name: string;
  exchange?: string;
  exchangeShortName?: string;
  stockType?: string;
}
