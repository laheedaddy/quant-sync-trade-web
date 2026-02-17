'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  findOrCreateInstance,
  addInstanceIndicator as apiAddIndicator,
  editInstanceIndicator as apiEditIndicator,
  removeInstanceIndicator as apiRemoveIndicator,
  addInstanceRule as apiAddRule,
  editInstanceRule as apiEditRule,
  removeInstanceRule as apiRemoveRule,
} from '@/lib/api/strategy-instance';
import { showError, showSuccess } from '@/lib/toast';
import type {
  GetUserStrategyInstanceDto,
  GetUserIndicatorConfigDto,
  GetUserSignalRuleDto,
  CreateIndicatorRequest,
  UpdateIndicatorRequest,
  CreateRuleRequest,
  UpdateRuleRequest,
} from '@/types/strategy';

/**
 * 전략 인스턴스 관리 훅
 * (전략, 종목, 타임프레임) 조합별 독립 설정 관리
 *
 * liveSnapshot의 indicators/rules를 기존 GetUserIndicatorConfigDto[]/GetUserSignalRuleDto[] 형태로 변환하여
 * 기존 StrategyEditor 호환성을 유지합니다.
 */
export function useStrategyInstance(
  strategyNo: number | null,
  symbol: string,
  timeframe: string,
) {
  const [instance, setInstance] = useState<GetUserStrategyInstanceDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!strategyNo || !symbol || !timeframe) {
      setInstance(null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await findOrCreateInstance(strategyNo, { symbol, timeframe });
      setInstance(result);
    } catch (err) {
      showError(err, '인스턴스 로드 실패');
      setInstance(null);
    } finally {
      setIsLoading(false);
    }
  }, [strategyNo, symbol, timeframe]);

  useEffect(() => {
    load();
  }, [load]);

  // liveSnapshot에서 indicators를 GetUserIndicatorConfigDto[] 형태로 변환
  const indicators: GetUserIndicatorConfigDto[] = useMemo(() => {
    if (!instance?.liveSnapshot?.indicators) return [];
    return instance.liveSnapshot.indicators.map((ind, idx) => ({
      userIndicatorConfigNo: ind.userIndicatorConfigNo,
      userStrategyNo: instance.userStrategyNo,
      indicatorType: ind.indicatorType,
      displayName: ind.displayName,
      parameters: ind.parameters as Record<string, number>,
      paramHash: ind.paramHash,
      isActive: true,
      isDelete: false,
      createdAt: instance.createdAt,
      createdBy: 0,
    }));
  }, [instance]);

  // liveSnapshot에서 rules를 GetUserSignalRuleDto[] 형태로 변환
  const rules: GetUserSignalRuleDto[] = useMemo(() => {
    if (!instance?.liveSnapshot) return [];
    const buyRules = (instance.liveSnapshot.buyRules || []).map((r) => ({
      userSignalRuleNo: r.userSignalRuleNo,
      userStrategyNo: instance.userStrategyNo,
      ruleType: 'BUY' as const,
      conditions: r.conditions as any,
      priority: r.priority,
      isActive: true,
      isDelete: false,
      createdAt: instance.createdAt,
      createdBy: 0,
    }));
    const sellRules = (instance.liveSnapshot.sellRules || []).map((r) => ({
      userSignalRuleNo: r.userSignalRuleNo,
      userStrategyNo: instance.userStrategyNo,
      ruleType: 'SELL' as const,
      conditions: r.conditions as any,
      priority: r.priority,
      isActive: true,
      isDelete: false,
      createdAt: instance.createdAt,
      createdBy: 0,
    }));
    return [...buyRules, ...sellRules];
  }, [instance]);

  const addIndicator = useCallback(
    async (body: CreateIndicatorRequest) => {
      if (!strategyNo || !instance) return;
      try {
        const updated = await apiAddIndicator(strategyNo, instance.userStrategyInstanceNo, body);
        setInstance(updated);
        showSuccess('지표가 추가되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo, instance],
  );

  const editIndicator = useCallback(
    async (indicatorConfigNo: number, body: UpdateIndicatorRequest) => {
      if (!strategyNo || !instance) return;
      // indicatorConfigNo로 index 찾기
      const idx = instance.liveSnapshot.indicators.findIndex(
        (ind) => ind.userIndicatorConfigNo === indicatorConfigNo,
      );
      if (idx === -1) return;

      const existing = instance.liveSnapshot.indicators[idx];
      try {
        const updated = await apiEditIndicator(strategyNo, instance.userStrategyInstanceNo, idx, {
          indicatorType: existing.indicatorType,
          displayName: body.displayName ?? existing.displayName,
          parameters: (body.parameters ?? existing.parameters) as Record<string, number>,
        });
        setInstance(updated);
        showSuccess('지표가 수정되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo, instance],
  );

  const removeIndicator = useCallback(
    async (indicatorConfigNo: number) => {
      if (!strategyNo || !instance) return;
      const idx = instance.liveSnapshot.indicators.findIndex(
        (ind) => ind.userIndicatorConfigNo === indicatorConfigNo,
      );
      if (idx === -1) return;

      try {
        const updated = await apiRemoveIndicator(strategyNo, instance.userStrategyInstanceNo, idx);
        setInstance(updated);
        showSuccess('지표가 삭제되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo, instance],
  );

  const addRule = useCallback(
    async (body: CreateRuleRequest) => {
      if (!strategyNo || !instance) return;
      try {
        const updated = await apiAddRule(strategyNo, instance.userStrategyInstanceNo, {
          ruleType: body.ruleType,
          conditions: body.conditions,
          priority: body.priority,
        });
        setInstance(updated);
        showSuccess('규칙이 추가되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo, instance],
  );

  const editRule = useCallback(
    async (ruleNo: number, body: UpdateRuleRequest) => {
      if (!strategyNo || !instance) return;
      // ruleNo로 BUY/SELL 중 어디에 있는지 + index 찾기
      const buyIdx = instance.liveSnapshot.buyRules.findIndex(
        (r) => r.userSignalRuleNo === ruleNo,
      );
      const sellIdx = instance.liveSnapshot.sellRules.findIndex(
        (r) => r.userSignalRuleNo === ruleNo,
      );

      let ruleType: string;
      let index: number;
      let existingRule: any;

      if (buyIdx !== -1) {
        ruleType = 'BUY';
        index = buyIdx;
        existingRule = instance.liveSnapshot.buyRules[buyIdx];
      } else if (sellIdx !== -1) {
        ruleType = 'SELL';
        index = sellIdx;
        existingRule = instance.liveSnapshot.sellRules[sellIdx];
      } else {
        return;
      }

      try {
        const updated = await apiEditRule(
          strategyNo,
          instance.userStrategyInstanceNo,
          ruleType,
          index,
          {
            ruleType,
            conditions: (body.conditions ?? existingRule.conditions) as any,
            priority: body.priority ?? existingRule.priority,
          },
        );
        setInstance(updated);
        showSuccess('규칙이 수정되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo, instance],
  );

  const removeRule = useCallback(
    async (ruleNo: number) => {
      if (!strategyNo || !instance) return;
      const buyIdx = instance.liveSnapshot.buyRules.findIndex(
        (r) => r.userSignalRuleNo === ruleNo,
      );
      const sellIdx = instance.liveSnapshot.sellRules.findIndex(
        (r) => r.userSignalRuleNo === ruleNo,
      );

      let ruleType: string;
      let index: number;

      if (buyIdx !== -1) {
        ruleType = 'BUY';
        index = buyIdx;
      } else if (sellIdx !== -1) {
        ruleType = 'SELL';
        index = sellIdx;
      } else {
        return;
      }

      try {
        const updated = await apiRemoveRule(
          strategyNo,
          instance.userStrategyInstanceNo,
          ruleType,
          index,
        );
        setInstance(updated);
        showSuccess('규칙이 삭제되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo, instance],
  );

  return {
    instance,
    isLoading,
    indicators,
    rules,
    addIndicator,
    editIndicator,
    removeIndicator,
    addRule,
    editRule,
    removeRule,
    reload: load,
  };
}
