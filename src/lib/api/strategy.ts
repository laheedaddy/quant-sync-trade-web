import { apiClient } from './client';
import type {
  GetUserStrategyDto,
  CreateStrategyRequest,
  UpdateStrategyRequest,
} from '@/types/strategy';

const BASE = '/v1/strategy';

export async function fetchStrategies(symbol: string, timeframe: string): Promise<GetUserStrategyDto[]> {
  return apiClient<GetUserStrategyDto[]>(
    `${BASE}?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`,
  );
}

export async function fetchStrategyDetail(userStrategyNo: number): Promise<GetUserStrategyDto> {
  return apiClient<GetUserStrategyDto>(`${BASE}/${userStrategyNo}`);
}

export async function createStrategy(body: CreateStrategyRequest): Promise<GetUserStrategyDto> {
  return apiClient<GetUserStrategyDto>(BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateStrategy(
  userStrategyNo: number,
  body: UpdateStrategyRequest,
): Promise<GetUserStrategyDto> {
  return apiClient<GetUserStrategyDto>(`${BASE}/${userStrategyNo}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteStrategy(userStrategyNo: number): Promise<void> {
  await apiClient<void>(`${BASE}/${userStrategyNo}`, { method: 'DELETE' });
}

export async function activateStrategy(userStrategyNo: number): Promise<GetUserStrategyDto> {
  return apiClient<GetUserStrategyDto>(`${BASE}/${userStrategyNo}/activate`, {
    method: 'PUT',
  });
}

export async function deactivateStrategy(userStrategyNo: number): Promise<GetUserStrategyDto> {
  return apiClient<GetUserStrategyDto>(`${BASE}/${userStrategyNo}/deactivate`, {
    method: 'PUT',
  });
}
