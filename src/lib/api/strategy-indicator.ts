import { apiClient } from './client';
import type {
  GetUserIndicatorConfigDto,
  CreateIndicatorRequest,
  UpdateIndicatorRequest,
} from '@/types/strategy';

function base(userStrategyNo: number) {
  return `/v1/strategy/${userStrategyNo}/indicator`;
}

export async function fetchIndicators(userStrategyNo: number): Promise<GetUserIndicatorConfigDto[]> {
  return apiClient<GetUserIndicatorConfigDto[]>(base(userStrategyNo));
}

export async function addIndicator(
  userStrategyNo: number,
  body: CreateIndicatorRequest,
): Promise<GetUserIndicatorConfigDto> {
  return apiClient<GetUserIndicatorConfigDto>(base(userStrategyNo), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateIndicator(
  userStrategyNo: number,
  indicatorConfigNo: number,
  body: UpdateIndicatorRequest,
): Promise<GetUserIndicatorConfigDto> {
  return apiClient<GetUserIndicatorConfigDto>(`${base(userStrategyNo)}/${indicatorConfigNo}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteIndicator(
  userStrategyNo: number,
  indicatorConfigNo: number,
): Promise<void> {
  await apiClient<void>(`${base(userStrategyNo)}/${indicatorConfigNo}`, { method: 'DELETE' });
}
