'use client';

import { useEffect, useCallback } from 'react';
import { useStrategyStore } from '@/stores/strategy-store';
import {
  fetchStrategies,
  createStrategy,
  deleteStrategy,
  activateStrategy,
  deactivateStrategy,
} from '@/lib/api/strategy';
import type { CreateStrategyRequest } from '@/types/strategy';

export function useStrategies() {
  const store = useStrategyStore();

  const load = useCallback(async () => {
    store.setIsLoading(true);
    store.setError(null);
    try {
      const list = await fetchStrategies();
      store.setStrategies(list);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to fetch strategies');
    } finally {
      store.setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (body: CreateStrategyRequest) => {
    const created = await createStrategy(body);
    store.addStrategy(created);
    return created;
  }, []);

  const remove = useCallback(async (userStrategyNo: number) => {
    await deleteStrategy(userStrategyNo);
    store.removeStrategy(userStrategyNo);
  }, []);

  const toggleActive = useCallback(async (userStrategyNo: number, currentlyActive: boolean) => {
    const updated = currentlyActive
      ? await deactivateStrategy(userStrategyNo)
      : await activateStrategy(userStrategyNo);
    store.updateStrategy(userStrategyNo, { isActive: updated.isActive });
  }, []);

  return {
    strategies: store.strategies,
    isLoading: store.isLoading,
    error: store.error,
    create,
    remove,
    toggleActive,
    reload: load,
  };
}
