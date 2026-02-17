import { apiClient } from './client';
import type { GetUserStrategyVersionDto, CreateVersionRequest } from '@/types/strategy';

const base = (strategyNo: number) => `/v1/strategy/${strategyNo}/version`;

export async function fetchVersions(
  strategyNo: number,
  versionType?: string,
): Promise<GetUserStrategyVersionDto[]> {
  const params = versionType ? `?versionType=${versionType}` : '';
  return apiClient<GetUserStrategyVersionDto[]>(`${base(strategyNo)}${params}`);
}

export async function createVersion(
  strategyNo: number,
  body: CreateVersionRequest,
): Promise<GetUserStrategyVersionDto> {
  return apiClient<GetUserStrategyVersionDto>(base(strategyNo), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchVersionDetail(
  strategyNo: number,
  versionNo: number,
): Promise<GetUserStrategyVersionDto> {
  return apiClient<GetUserStrategyVersionDto>(`${base(strategyNo)}/${versionNo}`);
}

export async function deleteVersion(
  strategyNo: number,
  versionNo: number,
): Promise<void> {
  await apiClient<void>(`${base(strategyNo)}/${versionNo}`, { method: 'DELETE' });
}

export async function restoreVersion(
  strategyNo: number,
  versionNo: number,
): Promise<void> {
  await apiClient<void>(`${base(strategyNo)}/${versionNo}/restore`, { method: 'POST' });
}

export async function promoteVersion(
  versionNo: number,
  description?: string,
): Promise<GetUserStrategyVersionDto> {
  return apiClient<GetUserStrategyVersionDto>(`/v1/strategy/version/${versionNo}/promote`, {
    method: 'PUT',
    body: JSON.stringify({ description }),
  });
}

export async function triggerAutoVersion(
  userStrategyNo: number,
  description: string,
): Promise<void> {
  await apiClient<void>(`/v1/strategy/${userStrategyNo}/auto-version`, {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}
