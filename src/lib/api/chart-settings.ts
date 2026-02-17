import type { ChartSettings, UpdateChartSettingsRequest } from '@/types/chart';
import { apiClient } from './client';

export async function fetchChartSettings(
  symbol: string,
  timeframe: string,
  userStrategyNo: number = 0,
): Promise<ChartSettings> {
  const searchParams = new URLSearchParams();
  searchParams.set('timeframe', timeframe);
  searchParams.set('userStrategyNo', userStrategyNo.toString());

  const path = `/v1/chart/${encodeURIComponent(symbol)}/settings?${searchParams.toString()}`;
  return apiClient<ChartSettings>(path);
}

export async function updateChartSettings(
  symbol: string,
  timeframe: string,
  body: UpdateChartSettingsRequest,
  userStrategyNo: number = 0,
): Promise<ChartSettings> {
  const searchParams = new URLSearchParams();
  searchParams.set('timeframe', timeframe);
  searchParams.set('userStrategyNo', userStrategyNo.toString());

  return apiClient<ChartSettings>(
    `/v1/chart/${encodeURIComponent(symbol)}/settings?${searchParams.toString()}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  );
}
