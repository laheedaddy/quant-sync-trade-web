import { consoleApiClient } from './console-client';
import { ApiError } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  Stock,
  StockQuery,
  UpdateStockRequest,
  BackfillRequest,
  BackfillResult,
  FmpSearchResult,
  FmpIndex,
  BulkRegisterItem,
} from '@/types/management';

// ──────────────────────────────────────────────
// Stock
// ──────────────────────────────────────────────

export async function fetchStocks(query?: StockQuery): Promise<{ items: Stock[]; totalCount: number }> {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, String(value));
      }
    }
  }
  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`/console-api/v1/stock${qs}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    let message = `API Error: ${res.status} ${res.statusText}`;
    try {
      const errorBody = await res.json();
      if (errorBody?.message) message = errorBody.message;
    } catch {
      // body not parseable
    }
    throw new ApiError(res.status, message);
  }

  const json: ApiResponse<Stock[]> = await res.json();
  if (!json.isSuccess) {
    throw new ApiError(json.statusCode, json.message);
  }

  return { items: json.data.result, totalCount: json.data.totalCount ?? 0 };
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

export async function restoreStock(no: number): Promise<Stock> {
  return consoleApiClient<Stock>(`/v1/stock/${no}/restore`, {
    method: 'POST',
  });
}

export async function backfillStock(stockNo: number, body: BackfillRequest): Promise<BackfillResult> {
  return consoleApiClient<BackfillResult>(`/v1/stock/${stockNo}/backfill`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function enrichProfiles(batchSize: number = 50): Promise<{ enriched: number; reconciled: number }> {
  return consoleApiClient<{ enriched: number; reconciled: number }>(`/v1/stock/enrich-profiles?batchSize=${batchSize}`, {
    method: 'POST',
  });
}

export async function enrichStock(stockNo: number): Promise<Stock> {
  return consoleApiClient<Stock>(`/v1/stock/${stockNo}/enrich`, {
    method: 'POST',
  });
}

// ──────────────────────────────────────────────
// FMP Search / Bulk Register
// ──────────────────────────────────────────────

export async function searchFmpStocks(query: string, limit: number = 30): Promise<FmpSearchResult[]> {
  return consoleApiClient<FmpSearchResult[]>(
    `/v1/stock/fmp-search?query=${encodeURIComponent(query)}&limit=${limit}`,
  );
}

export async function fetchFmpIndex(index: FmpIndex): Promise<FmpSearchResult[]> {
  return consoleApiClient<FmpSearchResult[]>(`/v1/stock/fmp-index/${index}`);
}

export async function bulkRegisterStocks(items: BulkRegisterItem[]): Promise<number> {
  return consoleApiClient<number>('/v1/stock/bulk-register', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}
