'use client';

import { useEffect, useCallback } from 'react';
import { useStrategyDetailStore } from '@/stores/strategy-detail-store';
import { useChartStore } from '@/stores/chart-store';
import { fetchStrategyDetail, updateStrategy } from '@/lib/api/strategy';
import { fetchIndicators, addIndicator as apiAddIndicator, updateIndicator as apiUpdateIndicator, deleteIndicator as apiDeleteIndicator } from '@/lib/api/strategy-indicator';
import { fetchRules, addRule as apiAddRule, updateRule as apiUpdateRule, deleteRule as apiDeleteRule } from '@/lib/api/strategy-rule';
import type {
  UpdateStrategyRequest,
  CreateIndicatorRequest,
  UpdateIndicatorRequest,
  CreateRuleRequest,
  UpdateRuleRequest,
} from '@/types/strategy';
import { showError, showSuccess } from '@/lib/toast';

export function useStrategyDetail(userStrategyNo: number) {
  const store = useStrategyDetailStore();
  const { strategyIndicatorVersion } = useChartStore();

  const load = useCallback(async () => {
    if (!userStrategyNo) {
      store.setIsLoading(false);
      return;
    }
    store.setIsLoading(true);
    store.setError(null);
    try {
      const [strategy, indicators, rules] = await Promise.all([
        fetchStrategyDetail(userStrategyNo),
        fetchIndicators(userStrategyNo),
        fetchRules(userStrategyNo),
      ]);
      store.setStrategy(strategy);
      store.setIndicators(indicators);
      store.setRules(rules);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to fetch strategy');
      showError(err);
    } finally {
      store.setIsLoading(false);
    }
  }, [userStrategyNo, strategyIndicatorVersion]);

  useEffect(() => {
    load();
    return () => {
      store.setStrategy(null);
      store.setIndicators([]);
      store.setRules([]);
    };
  }, [load]);

  const update = useCallback(
    async (body: UpdateStrategyRequest) => {
      try {
        const updated = await updateStrategy(userStrategyNo, body);
        store.setStrategy(updated);
        showSuccess('전략이 업데이트되었습니다.');
        return updated;
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [userStrategyNo],
  );

  const addIndicator = useCallback(
    async (body: CreateIndicatorRequest) => {
      try {
        const ind = await apiAddIndicator(userStrategyNo, body);
        store.addIndicator(ind);
        showSuccess('지표가 추가되었습니다.');
        return ind;
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [userStrategyNo],
  );

  const editIndicator = useCallback(
    async (indicatorConfigNo: number, body: UpdateIndicatorRequest) => {
      try {
        const ind = await apiUpdateIndicator(userStrategyNo, indicatorConfigNo, body);
        store.updateIndicator(indicatorConfigNo, ind);
        showSuccess('지표가 수정되었습니다.');
        return ind;
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [userStrategyNo],
  );

  const removeIndicator = useCallback(
    async (indicatorConfigNo: number) => {
      try {
        await apiDeleteIndicator(userStrategyNo, indicatorConfigNo);
        store.removeIndicator(indicatorConfigNo);
        showSuccess('지표가 삭제되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [userStrategyNo],
  );

  const addRule = useCallback(
    async (body: CreateRuleRequest) => {
      try {
        const rule = await apiAddRule(userStrategyNo, body);
        store.addRule(rule);
        showSuccess('규칙이 추가되었습니다.');
        return rule;
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [userStrategyNo],
  );

  const editRule = useCallback(
    async (ruleNo: number, body: UpdateRuleRequest) => {
      try {
        const rule = await apiUpdateRule(userStrategyNo, ruleNo, body);
        store.updateRule(ruleNo, rule);
        showSuccess('규칙이 수정되었습니다.');
        return rule;
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [userStrategyNo],
  );

  const removeRule = useCallback(
    async (ruleNo: number) => {
      try {
        await apiDeleteRule(userStrategyNo, ruleNo);
        store.removeRule(ruleNo);
        showSuccess('규칙이 삭제되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [userStrategyNo],
  );

  return {
    strategy: store.strategy,
    indicators: store.indicators,
    rules: store.rules,
    isLoading: store.isLoading,
    error: store.error,
    update,
    addIndicator,
    editIndicator,
    removeIndicator,
    addRule,
    editRule,
    removeRule,
    reload: load,
  };
}
