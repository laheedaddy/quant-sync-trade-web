import type {
  UserChartDrawing,
  CreateChartDrawingRequest,
  UpdateChartDrawingRequest,
} from '@/types/chart';
import { apiClient } from './client';

export async function fetchChartDrawings(
  symbol: string,
  timeframe: string,
  userStrategyNo: number = 0,
): Promise<UserChartDrawing[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('timeframe', timeframe);
  searchParams.set('userStrategyNo', userStrategyNo.toString());

  const path = `/v1/chart/${encodeURIComponent(symbol)}/drawing?${searchParams.toString()}`;
  return apiClient<UserChartDrawing[]>(path);
}

export async function addChartDrawing(
  symbol: string,
  timeframe: string,
  body: CreateChartDrawingRequest,
  userStrategyNo: number = 0,
): Promise<UserChartDrawing> {
  const searchParams = new URLSearchParams();
  searchParams.set('timeframe', timeframe);
  searchParams.set('userStrategyNo', userStrategyNo.toString());

  return apiClient<UserChartDrawing>(
    `/v1/chart/${encodeURIComponent(symbol)}/drawing?${searchParams.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export async function updateChartDrawing(
  drawingNo: number,
  body: UpdateChartDrawingRequest,
): Promise<UserChartDrawing> {
  return apiClient<UserChartDrawing>(`/v1/chart/drawing/${drawingNo}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteChartDrawing(drawingNo: number): Promise<void> {
  await apiClient<void>(`/v1/chart/drawing/${drawingNo}`, { method: 'DELETE' });
}

export async function updateDrawingsPriceScaleMode(
  symbol: string,
  timeframe: string,
  priceScaleMode: number,
  userStrategyNo: number = 0,
): Promise<{ updated: number }> {
  const searchParams = new URLSearchParams();
  searchParams.set('timeframe', timeframe);
  searchParams.set('userStrategyNo', userStrategyNo.toString());
  searchParams.set('priceScaleMode', priceScaleMode.toString());

  return apiClient<{ updated: number }>(
    `/v1/chart/${encodeURIComponent(symbol)}/drawing/price-scale-mode?${searchParams.toString()}`,
    { method: 'PUT' },
  );
}
