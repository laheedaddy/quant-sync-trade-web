'use client';

import { useMemo } from 'react';
import { useStrategyDetailStore } from '@/stores/strategy-detail-store';
import { useChartStore } from '@/stores/chart-store';
import type { GetUserIndicatorConfigDto } from '@/types/strategy';

/**
 * 조건 폼(Threshold/Cross/Price)에서 사용할 인디케이터 목록.
 * 전략 모드일 때 chart-store.availableConfigs에서 직접 읽어 즉시 반영.
 * 비전략 모드일 때 strategy-detail-store.indicators 사용.
 */
export function useConditionIndicators(): GetUserIndicatorConfigDto[] {
  const storeIndicators = useStrategyDetailStore((s) => s.indicators);
  const chartConfigs = useChartStore((s) => s.availableConfigs);
  const activeStrategyNo = useChartStore((s) => s.activeStrategyNo);

  return useMemo(() => {
    if (!activeStrategyNo) return storeIndicators;

    return chartConfigs.map((c) => ({
      userIndicatorConfigNo: c.userChartIndicatorConfigNo,
      userStrategyNo: activeStrategyNo,
      indicatorType: c.indicatorType,
      displayName: c.displayName,
      parameters: c.parameters as Record<string, number>,
      paramHash: c.paramHash,
      isActive: c.isActive,
      isDelete: false,
      createdAt: c.createdAt,
      createdBy: c.createdBy,
    }));
  }, [activeStrategyNo, chartConfigs, storeIndicators]);
}
