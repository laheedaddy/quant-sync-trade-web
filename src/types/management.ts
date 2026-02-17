// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const EXCHANGES = ['NASDAQ', 'NYSE', 'AMEX', 'KRX', 'KOSPI', 'KOSDAQ', 'BINANCE'] as const;
export type Exchange = (typeof EXCHANGES)[number];

export const TIMEFRAMES = ['1min', '5min', '15min', '30min', '1hour', '4hour', '1day', '1week'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const COLLECTION_TYPES = ['PRICE'] as const;
export type CollectionType = (typeof COLLECTION_TYPES)[number];

// ──────────────────────────────────────────────
// Stock
// ──────────────────────────────────────────────

export interface Stock {
  stockNo: number;
  symbol: string;
  stockName: string;
  exchange: string;
  exchangeShortName: string;
  stockType: string;
  isActive: boolean;
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
}

export interface UpdateStockRequest {
  isActive?: boolean;
}

// ──────────────────────────────────────────────
// CollectionTarget
// ──────────────────────────────────────────────

export interface CollectionTarget {
  collectionTargetNo: number;
  symbol: string;
  collectionType: string;
  timeframe: string;
  isActive: boolean;
  lastCollectedAt?: string;
  memo?: string;
  isDelete: boolean;
  createdAt: string;
  createdBy: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface CreateCollectionTargetRequest {
  symbol: string;
  collectionType?: string;
  timeframe?: string;
  memo?: string;
}

export interface UpdateCollectionTargetRequest {
  isActive?: boolean;
  memo?: string;
}

export interface BackfillRequest {
  from: string;
  to?: string;
}

export interface BackfillResult {
  symbol: string;
  timeframe: string;
  from: string;
  to: string;
  collected: number;
}
