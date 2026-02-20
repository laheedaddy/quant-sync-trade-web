import { consoleApiClient } from './console-client';
import type {
  Stock,
  CreateStockRequest,
  UpdateStockRequest,
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

export async function backfillStock(stockNo: number, body: BackfillRequest): Promise<BackfillResult> {
  return consoleApiClient<BackfillResult>(`/v1/stock/${stockNo}/backfill`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function collectDaily(): Promise<{ stock: number; crypto: number }> {
  return consoleApiClient<{ stock: number; crypto: number }>('/v1/stock/collect-daily', {
    method: 'POST',
  });
}
