import type { StockSearchResult } from '@/types/stock';
import { apiClient } from './client';

export async function searchStocks(
  keyword: string,
  limit: number = 20,
): Promise<StockSearchResult[]> {
  return apiClient<StockSearchResult[]>(
    `/v1/stock/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
  );
}
