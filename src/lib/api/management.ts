import { consoleApiClient } from './console-client';
import type {
  Stock,
  CreateStockRequest,
  UpdateStockRequest,
  CollectionTarget,
  CreateCollectionTargetRequest,
  UpdateCollectionTargetRequest,
  BackfillRequest,
  BackfillResult,
} from '@/types/management';

// ──────────────────────────────────────────────
// Stock
// ──────────────────────────────────────────────

export async function fetchStocks(exchange?: string): Promise<Stock[]> {
  const query = exchange ? `?exchange=${encodeURIComponent(exchange)}` : '';
  return consoleApiClient<Stock[]>(`/v1/stock${query}`);
}

export async function createStock(body: CreateStockRequest): Promise<Stock> {
  return consoleApiClient<Stock>('/v1/stock', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateStock(no: number, body: UpdateStockRequest): Promise<Stock> {
  return consoleApiClient<Stock>(`/v1/stock/${no}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteStock(no: number): Promise<boolean> {
  return consoleApiClient<boolean>(`/v1/stock/${no}`, {
    method: 'DELETE',
  });
}

export async function syncStocksFromFmp(exchange?: string): Promise<number> {
  const query = exchange ? `?exchange=${encodeURIComponent(exchange)}` : '';
  return consoleApiClient<number>(`/v1/stock/sync-fmp${query}`, {
    method: 'POST',
  });
}

export async function syncCryptoFromBinance(quoteAsset: string = 'USDT'): Promise<number> {
  return consoleApiClient<number>(`/v1/stock/sync-binance?quoteAsset=${encodeURIComponent(quoteAsset)}`, {
    method: 'POST',
  });
}

// ──────────────────────────────────────────────
// CollectionTarget
// ──────────────────────────────────────────────

export async function fetchCollectionTargets(): Promise<CollectionTarget[]> {
  return consoleApiClient<CollectionTarget[]>('/v1/collector/target');
}

export async function createCollectionTarget(body: CreateCollectionTargetRequest): Promise<CollectionTarget> {
  return consoleApiClient<CollectionTarget>('/v1/collector/target', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCollectionTarget(no: number, body: UpdateCollectionTargetRequest): Promise<CollectionTarget> {
  return consoleApiClient<CollectionTarget>(`/v1/collector/target/${no}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteCollectionTarget(no: number): Promise<boolean> {
  return consoleApiClient<boolean>(`/v1/collector/target/${no}`, {
    method: 'DELETE',
  });
}

export async function backfillCollectionTarget(no: number, body: BackfillRequest): Promise<BackfillResult> {
  return consoleApiClient<BackfillResult>(`/v1/collector/target/${no}/backfill`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
