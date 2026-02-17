import type {
  ChartResponse,
  Timeframe,
  UserChartIndicatorConfig,
  CreateChartIndicatorRequest,
  UpdateChartIndicatorRequest,
} from '@/types/chart';
import { apiClient } from './client';

interface FetchChartDataParams {
  timeframe?: Timeframe;
  before?: string;
  limit?: number;
  userStrategyNo?: number;
  userStrategyVersionNo?: number;
  candlesOnly?: boolean;
}

export async function fetchChartData(
  symbol: string,
  params?: FetchChartDataParams,
): Promise<ChartResponse> {
  const searchParams = new URLSearchParams();

  if (params?.timeframe) searchParams.set('timeframe', params.timeframe);
  if (params?.before) searchParams.set('before', params.before);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.userStrategyNo) searchParams.set('userStrategyNo', params.userStrategyNo.toString());
  if (params?.userStrategyVersionNo) searchParams.set('userStrategyVersionNo', params.userStrategyVersionNo.toString());
  if (params?.candlesOnly) searchParams.set('candlesOnly', 'true');

  const query = searchParams.toString();
  const path = `/v1/chart/${encodeURIComponent(symbol)}${query ? `?${query}` : ''}`;

  const raw = await apiClient<ChartResponse>(path);

  // Normalize: backend returns numeric fields as strings
  return {
    ...raw,
    candles: raw.candles.map((c) => ({
      ...c,
      openPrice: Number(c.openPrice),
      highPrice: Number(c.highPrice),
      lowPrice: Number(c.lowPrice),
      closePrice: Number(c.closePrice),
      volume: Number(c.volume),
    })),
    indicators: raw.indicators.map((ind) => ({
      ...ind,
      indicatorConfigNo: Number(ind.indicatorConfigNo),
    })),
  };
}

export async function fetchChartIndicatorConfigs(
  symbol: string,
  timeframe: string,
): Promise<UserChartIndicatorConfig[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('timeframe', timeframe);

  const path = `/v1/chart/${encodeURIComponent(symbol)}/indicator?${searchParams.toString()}`;
  return apiClient<UserChartIndicatorConfig[]>(path);
}

export async function addChartIndicatorConfig(
  symbol: string,
  timeframe: string,
  body: CreateChartIndicatorRequest,
): Promise<UserChartIndicatorConfig> {
  const searchParams = new URLSearchParams();
  searchParams.set('timeframe', timeframe);

  return apiClient<UserChartIndicatorConfig>(
    `/v1/chart/${encodeURIComponent(symbol)}/indicator?${searchParams.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export async function updateChartIndicatorConfig(
  configNo: number,
  body: UpdateChartIndicatorRequest,
): Promise<UserChartIndicatorConfig> {
  return apiClient<UserChartIndicatorConfig>(`/v1/chart/indicator/${configNo}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function toggleChartIndicatorConfig(
  configNo: number,
): Promise<UserChartIndicatorConfig> {
  return apiClient<UserChartIndicatorConfig>(`/v1/chart/indicator/${configNo}/toggle`, {
    method: 'PUT',
  });
}

export async function deleteChartIndicatorConfig(configNo: number): Promise<void> {
  await apiClient<void>(`/v1/chart/indicator/${configNo}`, { method: 'DELETE' });
}
