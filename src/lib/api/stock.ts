import type { StockSearchResult } from '@/types/stock';
import { apiClient } from './client';

export async function searchStocks(
  keyword: string,
  limit: number = 20,
  stockType?: string,
): Promise<StockSearchResult[]> {
  const params = new URLSearchParams({ keyword, limit: String(limit) });
  if (stockType) params.set('stockType', stockType);
  return apiClient<StockSearchResult[]>(`/v1/stock/search?${params.toString()}`);
}

export async function getStockBySymbol(symbol: string): Promise<StockSearchResult | null> {
  try {
    const results = await searchStocks(symbol, 1);
    return results.find(r => r.symbol === symbol) ?? null;
  } catch {
    return null;
  }
}
