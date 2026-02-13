'use client';

import { useEffect, useCallback } from 'react';
import { useStrategyDetailStore } from '@/stores/strategy-detail-store';
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

export function useStrategyDetail(userStrategyNo: number) {
  const store = useStrategyDetailStore();

  const load = useCallback(async () => {
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
    } finally {
      store.setIsLoading(false);
    }
  }, [userStrategyNo]);

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
      const updated = await updateStrategy(userStrategyNo, body);
      store.setStrategy(updated);
      return updated;
    },
    [userStrategyNo],
  );

  const addIndicator = useCallback(
    async (body: CreateIndicatorRequest) => {
      const ind = await apiAddIndicator(userStrategyNo, body);
      store.addIndicator(ind);
      return ind;
    },
    [userStrategyNo],
  );

  const editIndicator = useCallback(
    async (indicatorConfigNo: number, body: UpdateIndicatorRequest) => {
      const ind = await apiUpdateIndicator(userStrategyNo, indicatorConfigNo, body);
      store.updateIndicator(indicatorConfigNo, ind);
      return ind;
    },
    [userStrategyNo],
  );

  const removeIndicator = useCallback(
    async (indicatorConfigNo: number) => {
      await apiDeleteIndicator(userStrategyNo, indicatorConfigNo);
      store.removeIndicator(indicatorConfigNo);
    },
    [userStrategyNo],
  );

  const addRule = useCallback(
    async (body: CreateRuleRequest) => {
      const rule = await apiAddRule(userStrategyNo, body);
      store.addRule(rule);
      return rule;
    },
    [userStrategyNo],
  );

  const editRule = useCallback(
    async (ruleNo: number, body: UpdateRuleRequest) => {
      const rule = await apiUpdateRule(userStrategyNo, ruleNo, body);
      store.updateRule(ruleNo, rule);
      return rule;
    },
    [userStrategyNo],
  );

  const removeRule = useCallback(
    async (ruleNo: number) => {
      await apiDeleteRule(userStrategyNo, ruleNo);
      store.removeRule(ruleNo);
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
