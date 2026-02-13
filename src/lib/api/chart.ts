import type { ChartResponse, IndicatorConfig, Timeframe } from '@/types/chart';
import { apiClient } from './client';

interface FetchChartDataParams {
  timeframe?: Timeframe;
  indicatorConfigNos?: number[];
  before?: string;
  limit?: number;
}

export async function fetchChartData(
  symbol: string,
  params?: FetchChartDataParams,
): Promise<ChartResponse> {
  const searchParams = new URLSearchParams();

  if (params?.timeframe) searchParams.set('timeframe', params.timeframe);
  if (params?.before) searchParams.set('before', params.before);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.indicatorConfigNos?.length) {
    searchParams.set('indicatorConfigNos', params.indicatorConfigNos.join(','));
  }

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

export async function fetchIndicatorConfigs(
  timeframe?: Timeframe,
): Promise<IndicatorConfig[]> {
  const query = timeframe ? `?timeframe=${timeframe}` : '';
  const raw = await apiClient<IndicatorConfig[]>(`/v1/chart/indicator-configs${query}`);

  // Normalize indicatorConfigNo to number
  return raw.map((c) => ({
    ...c,
    indicatorConfigNo: Number(c.indicatorConfigNo),
  }));
}
