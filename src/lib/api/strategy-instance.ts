import { apiClient } from './client';
import type {
  GetUserStrategyInstanceDto,
  GetUserStrategyVersionDto,
  CreateVersionRequest,
} from '@/types/strategy';

const base = (strategyNo: number) => `/v1/strategy/${strategyNo}/instance`;

export async function findOrCreateInstance(
  strategyNo: number,
  body: { symbol: string; timeframe: string },
): Promise<GetUserStrategyInstanceDto> {
  return apiClient<GetUserStrategyInstanceDto>(base(strategyNo), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getInstanceDetail(
  strategyNo: number,
  instanceNo: number,
): Promise<GetUserStrategyInstanceDto> {
  return apiClient<GetUserStrategyInstanceDto>(`${base(strategyNo)}/${instanceNo}`);
}

export async function updateInstanceSnapshot(
  strategyNo: number,
  instanceNo: number,
  snapshot: unknown,
): Promise<GetUserStrategyInstanceDto> {
  return apiClient<GetUserStrategyInstanceDto>(`${base(strategyNo)}/${instanceNo}/snapshot`, {
    method: 'PUT',
    body: JSON.stringify({ liveSnapshot: snapshot }),
  });
}

export async function addInstanceIndicator(
  strategyNo: number,
  instanceNo: number,
  body: { indicatorType: string; displayName: string; parameters: Record<string, number> },
): Promise<GetUserStrategyInstanceDto> {
  return apiClient<GetUserStrategyInstanceDto>(`${base(strategyNo)}/${instanceNo}/indicator`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function editInstanceIndicator(
  strategyNo: number,
  instanceNo: number,
  index: number,
  body: { indicatorType: string; displayName: string; parameters: Record<string, number> },
): Promise<GetUserStrategyInstanceDto> {
  return apiClient<GetUserStrategyInstanceDto>(`${base(strategyNo)}/${instanceNo}/indicator/${index}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function removeInstanceIndicator(
  strategyNo: number,
  instanceNo: number,
  index: number,
): Promise<GetUserStrategyInstanceDto> {
  return apiClient<GetUserStrategyInstanceDto>(`${base(strategyNo)}/${instanceNo}/indicator/${index}`, {
    method: 'DELETE',
  });
}

export async function addInstanceRule(
  strategyNo: number,
  instanceNo: number,
  body: { ruleType: string; conditions: unknown; priority?: number },
): Promise<GetUserStrategyInstanceDto> {
  return apiClient<GetUserStrategyInstanceDto>(`${base(strategyNo)}/${instanceNo}/rule`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function editInstanceRule(
  strategyNo: number,
  instanceNo: number,
  ruleType: string,
  index: number,
  body: { ruleType: string; conditions: unknown; priority?: number },
): Promise<GetUserStrategyInstanceDto> {
  return apiClient<GetUserStrategyInstanceDto>(`${base(strategyNo)}/${instanceNo}/rule/${ruleType}/${index}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function removeInstanceRule(
  strategyNo: number,
  instanceNo: number,
  ruleType: string,
  index: number,
): Promise<GetUserStrategyInstanceDto> {
  return apiClient<GetUserStrategyInstanceDto>(`${base(strategyNo)}/${instanceNo}/rule/${ruleType}/${index}`, {
    method: 'DELETE',
  });
}

export async function createInstanceVersion(
  strategyNo: number,
  instanceNo: number,
  body: CreateVersionRequest,
): Promise<GetUserStrategyVersionDto> {
  return apiClient<GetUserStrategyVersionDto>(`${base(strategyNo)}/${instanceNo}/version`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchInstanceVersions(
  strategyNo: number,
  instanceNo: number,
  versionType?: string,
): Promise<GetUserStrategyVersionDto[]> {
  const params = versionType ? `?versionType=${versionType}` : '';
  return apiClient<GetUserStrategyVersionDto[]>(`${base(strategyNo)}/${instanceNo}/version${params}`);
}

export async function promoteVersion(
  versionNo: number,
): Promise<GetUserStrategyVersionDto> {
  return apiClient<GetUserStrategyVersionDto>(`/v1/strategy/version/${versionNo}/promote`, {
    method: 'PUT',
  });
}
