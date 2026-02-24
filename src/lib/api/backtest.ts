import { apiClient, ApiError, tryRefreshToken } from './client';
import type { ApiResponse } from '@/types/api';
import type { BacktestRun, BacktestConditionLog, RunBacktestRequest } from '@/types/backtest';
import { useAuthStore } from '@/stores/auth-store';

const BASE = '/v1/backtest';

export async function runBacktest(
  strategyNo: number,
  body: RunBacktestRequest,
): Promise<BacktestRun> {
  return apiClient<BacktestRun>(`${BASE}/strategy/${strategyNo}/run`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchBacktestRun(backtestRunNo: number): Promise<BacktestRun> {
  return apiClient<BacktestRun>(`${BASE}/${backtestRunNo}`);
}

export async function fetchBacktestHistory(
  strategyNo: number,
  filters?: { symbol?: string; timeframe?: string },
): Promise<BacktestRun[]> {
  const searchParams = new URLSearchParams();
  if (filters?.symbol) searchParams.set('symbol', filters.symbol);
  if (filters?.timeframe) searchParams.set('timeframe', filters.timeframe);
  const qs = searchParams.toString();
  return apiClient<BacktestRun[]>(`${BASE}/strategy/${strategyNo}/history${qs ? `?${qs}` : ''}`);
}

export async function deleteBacktestRun(backtestRunNo: number): Promise<void> {
  await apiClient<void>(`${BASE}/${backtestRunNo}`, { method: 'DELETE' });
}

export async function fetchConditionLogs(
  backtestRunNo: number,
  page = 1,
  limit = 50,
): Promise<{ logs: BacktestConditionLog[]; totalCount: number }> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));
  const url = `/api${BASE}/${backtestRunNo}/condition-logs?${searchParams.toString()}`;
  const token = useAuthStore.getState().accessToken;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res = await fetch(url, { headers });

  // 401 → refresh token으로 갱신 후 1회 재시도
  if (res.status === 401 && token) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = useAuthStore.getState().accessToken;
      res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newToken}` },
      });
    } else {
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!res.ok) {
    let message = `API Error: ${res.status} ${res.statusText}`;
    try {
      const errorBody = await res.json();
      if (errorBody?.message) message = errorBody.message;
    } catch { /* keep default */ }
    throw new ApiError(res.status, message);
  }

  const json: ApiResponse<BacktestConditionLog[]> = await res.json();
  if (!json.isSuccess) throw new ApiError(json.statusCode, json.message);

  return {
    logs: json.data.result,
    totalCount: json.data.totalCount ?? 0,
  };
}

export async function fetchBacktestHistoryByVersion(
  strategyNo: number,
  versionNo: number,
): Promise<BacktestRun[]> {
  return apiClient<BacktestRun[]>(`${BASE}/strategy/${strategyNo}/version/${versionNo}/history`);
}
