import { apiClient } from './client';
import type {
  GetUserSignalRuleDto,
  CreateRuleRequest,
  UpdateRuleRequest,
} from '@/types/strategy';

function base(userStrategyNo: number) {
  return `/v1/strategy/${userStrategyNo}/rule`;
}

export async function fetchRules(userStrategyNo: number): Promise<GetUserSignalRuleDto[]> {
  return apiClient<GetUserSignalRuleDto[]>(base(userStrategyNo));
}

export async function addRule(
  userStrategyNo: number,
  body: CreateRuleRequest,
): Promise<GetUserSignalRuleDto> {
  return apiClient<GetUserSignalRuleDto>(base(userStrategyNo), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateRule(
  userStrategyNo: number,
  ruleNo: number,
  body: UpdateRuleRequest,
): Promise<GetUserSignalRuleDto> {
  return apiClient<GetUserSignalRuleDto>(`${base(userStrategyNo)}/${ruleNo}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteRule(
  userStrategyNo: number,
  ruleNo: number,
): Promise<void> {
  await apiClient<void>(`${base(userStrategyNo)}/${ruleNo}`, { method: 'DELETE' });
}
