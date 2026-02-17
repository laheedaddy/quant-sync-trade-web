'use client';

import { useEffect, useCallback } from 'react';
import { useStrategyStore } from '@/stores/strategy-store';
import { useChartStore } from '@/stores/chart-store';
import {
  fetchStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  activateStrategy,
  deactivateStrategy,
} from '@/lib/api/strategy';
import type { UpdateStrategyRequest } from '@/types/strategy';
import { showError, showSuccess } from '@/lib/toast';

export function useStrategies() {
  const store = useStrategyStore();
  const { symbol, timeframe } = useChartStore();

  const load = useCallback(async () => {
    if (!symbol || !timeframe) return;
    store.setIsLoading(true);
    store.setError(null);
    try {
      const list = await fetchStrategies(symbol, timeframe);
      store.setStrategies(list);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to fetch strategies');
      showError(err);
    } finally {
      store.setIsLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (body: { name: string; description?: string }) => {
    if (!symbol || !timeframe) throw new Error('심볼/타임프레임 미설정');
    try {
      const created = await createStrategy({ ...body, symbol, timeframe });
      store.addStrategy(created);
      showSuccess('전략이 생성되었습니다.');
      return created;
    } catch (err) {
      showError(err);
      throw err;
    }
  }, [symbol, timeframe]);

  const remove = useCallback(async (userStrategyNo: number) => {
    try {
      await deleteStrategy(userStrategyNo);
      store.removeStrategy(userStrategyNo);
      showSuccess('전략이 삭제되었습니다.');
    } catch (err) {
      showError(err);
      throw err;
    }
  }, []);

  const update = useCallback(async (userStrategyNo: number, body: UpdateStrategyRequest) => {
    try {
      const updated = await updateStrategy(userStrategyNo, body);
      store.updateStrategy(userStrategyNo, { name: updated.name, description: updated.description });
      showSuccess('전략이 수정되었습니다.');
      return updated;
    } catch (err) {
      showError(err, '전략 수정 실패');
      throw err;
    }
  }, []);

  const toggleActive = useCallback(async (userStrategyNo: number, currentlyActive: boolean) => {
    try {
      const updated = currentlyActive
        ? await deactivateStrategy(userStrategyNo)
        : await activateStrategy(userStrategyNo);
      store.updateStrategy(userStrategyNo, { isActive: updated.isActive });
      showSuccess(updated.isActive ? '전략이 활성화되었습니다.' : '전략이 비활성화되었습니다.');
    } catch (err) {
      showError(err);
      throw err;
    }
  }, []);

  return {
    strategies: store.strategies,
    isLoading: store.isLoading,
    error: store.error,
    create,
    update,
    remove,
    toggleActive,
    reload: load,
  };
}
