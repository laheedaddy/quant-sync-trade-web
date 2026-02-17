'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useChartStore } from '@/stores/chart-store';
import { useBacktestStore } from '@/stores/backtest-store';
import {
  fetchChartIndicatorConfigs,
  addChartIndicatorConfig,
  updateChartIndicatorConfig,
  toggleChartIndicatorConfig,
  deleteChartIndicatorConfig,
} from '@/lib/api/chart';
import {
  fetchIndicators as fetchStrategyIndicators,
  addIndicator as addStrategyIndicator,
  updateIndicator as updateStrategyIndicator,
  deleteIndicator as deleteStrategyIndicator,
} from '@/lib/api/strategy-indicator';
import type { CreateChartIndicatorRequest, UpdateChartIndicatorRequest, UserChartIndicatorConfig } from '@/types/chart';
import { showError, showSuccess } from '@/lib/toast';

export function useChartIndicators() {
  const {
    symbol,
    timeframe,
    availableConfigs,
    activeStrategyNo,
    viewingVersionNo,
    setAvailableConfigs,
    updateConfig,
    addConfig,
    removeConfig,
    bumpStrategyIndicatorVersion,
    strategyIndicatorVersion,
  } = useChartStore();

  const isStrategyMode = activeStrategyNo !== null;
  const isVersionMode = viewingVersionNo !== null;

  // Read version snapshot indicators when in version mode
  const versions = useBacktestStore((s) => s.versions);
  const versionIndicatorConfigs = useMemo(() => {
    if (!isVersionMode || !viewingVersionNo) return undefined;
    const version = versions.find(
      (v) => Number(v.userStrategyVersionNo) === Number(viewingVersionNo),
    );
    if (!version) return undefined; // version not found (still loading)
    return version.snapshot?.indicators;
  }, [isVersionMode, viewingVersionNo, versions]);

  const load = useCallback(async () => {
    // Version mode: use snapshot indicator configs (no API call needed)
    if (isStrategyMode && isVersionMode) {
      if (versionIndicatorConfigs) {
        const mapped: UserChartIndicatorConfig[] = versionIndicatorConfigs.map((ind) => ({
          userChartIndicatorConfigNo: Number(ind.userIndicatorConfigNo),
          userNo: 0,
          symbol,
          timeframe,
          indicatorType: ind.indicatorType,
          displayName: ind.displayName,
          parameters: ind.parameters as Record<string, unknown>,
          paramHash: ind.paramHash,
          isActive: true, // all snapshot indicators are considered active
          isDelete: false,
          createdAt: '',
          createdBy: 0,
        }));
        setAvailableConfigs(mapped);
      }
      // If versionIndicatorConfigs is undefined, versions aren't loaded yet — wait
      return;
    }

    if (isStrategyMode) {
      // Live strategy mode: load strategy indicators from API
      try {
        const indicators = await fetchStrategyIndicators(activeStrategyNo!);
        const mapped: UserChartIndicatorConfig[] = indicators.map((ind) => ({
          userChartIndicatorConfigNo: Number(ind.userIndicatorConfigNo),
          userNo: 0,
          symbol,
          timeframe,
          indicatorType: ind.indicatorType,
          displayName: ind.displayName,
          parameters: ind.parameters as Record<string, unknown>,
          paramHash: ind.paramHash,
          isActive: ind.isActive,
          isDelete: false,
          createdAt: ind.createdAt,
          createdBy: ind.createdBy,
        }));
        setAvailableConfigs(mapped);
      } catch {
        setAvailableConfigs([]);
      }
      return;
    }
    try {
      const configs = await fetchChartIndicatorConfigs(symbol, timeframe);
      // Ensure numeric IDs (TypeORM bigint returns strings)
      setAvailableConfigs(configs.map((c) => ({
        ...c,
        userChartIndicatorConfigNo: Number(c.userChartIndicatorConfigNo),
      })));
    } catch {
      setAvailableConfigs([]);
    }
  }, [symbol, timeframe, activeStrategyNo, isStrategyMode, isVersionMode, versionIndicatorConfigs, setAvailableConfigs, strategyIndicatorVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleIndicator = useCallback(
    async (configNo: number) => {
      if (isStrategyMode) {
        // Strategy mode: toggle isActive (visibility only, no data refetch needed)
        const current = availableConfigs.find((c) => c.userChartIndicatorConfigNo === configNo);
        if (!current) return;
        const newIsActive = !current.isActive;
        updateConfig(configNo, { isActive: newIsActive });
        try {
          await updateStrategyIndicator(activeStrategyNo!, configNo, { isActive: newIsActive });
        } catch (err) {
          updateConfig(configNo, { isActive: current.isActive });
          showError(err);
        }
        return;
      }

      // Default mode
      const current = availableConfigs.find((c) => c.userChartIndicatorConfigNo === configNo);
      if (!current) return;

      updateConfig(configNo, { isActive: !current.isActive });

      try {
        const updated = await toggleChartIndicatorConfig(configNo);
        updateConfig(configNo, { ...updated, userChartIndicatorConfigNo: Number(updated.userChartIndicatorConfigNo) });
      } catch (err) {
        updateConfig(configNo, { isActive: current.isActive });
        showError(err);
      }
    },
    [availableConfigs, updateConfig, isStrategyMode, activeStrategyNo],
  );

  const addIndicator = useCallback(
    async (body: CreateChartIndicatorRequest) => {
      if (isStrategyMode) {
        try {
          const created = await addStrategyIndicator(activeStrategyNo!, {
            indicatorType: body.indicatorType as any,
            displayName: body.displayName,
            parameters: body.parameters as Record<string, number>,
          });
          const mapped: UserChartIndicatorConfig = {
            userChartIndicatorConfigNo: Number(created.userIndicatorConfigNo),
            userNo: 0,
            symbol,
            timeframe,
            indicatorType: created.indicatorType,
            displayName: created.displayName,
            parameters: created.parameters as Record<string, unknown>,
            paramHash: created.paramHash,
            isActive: created.isActive ?? true,
            isDelete: false,
            createdAt: created.createdAt,
            createdBy: created.createdBy,
          };
          addConfig(mapped);
          bumpStrategyIndicatorVersion();
          showSuccess('인디케이터가 추가되었습니다.');
          return mapped;
        } catch (err) {
          showError(err);
          throw err;
        }
      }

      try {
        const created = await addChartIndicatorConfig(symbol, timeframe, body);
        addConfig({ ...created, userChartIndicatorConfigNo: Number(created.userChartIndicatorConfigNo) });
        showSuccess('인디케이터가 추가되었습니다.');
        return created;
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [symbol, timeframe, addConfig, isStrategyMode, activeStrategyNo, bumpStrategyIndicatorVersion],
  );

  const updateIndicator = useCallback(
    async (configNo: number, body: UpdateChartIndicatorRequest) => {
      if (isStrategyMode) {
        try {
          const updated = await updateStrategyIndicator(activeStrategyNo!, configNo, body as any);
          updateConfig(configNo, {
            displayName: updated.displayName,
            parameters: updated.parameters as Record<string, unknown>,
            paramHash: updated.paramHash,
          });
          bumpStrategyIndicatorVersion();
          showSuccess('인디케이터가 수정되었습니다.');
          return updated;
        } catch (err) {
          showError(err);
          throw err;
        }
      }

      try {
        const updated = await updateChartIndicatorConfig(configNo, body);
        updateConfig(configNo, { ...updated, userChartIndicatorConfigNo: Number(updated.userChartIndicatorConfigNo) });
        showSuccess('인디케이터가 수정되었습니다.');
        return updated;
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [updateConfig, isStrategyMode, activeStrategyNo, bumpStrategyIndicatorVersion],
  );

  const deleteIndicator = useCallback(
    async (configNo: number) => {
      if (isStrategyMode) {
        try {
          await deleteStrategyIndicator(activeStrategyNo!, configNo);
          removeConfig(configNo);
          bumpStrategyIndicatorVersion();
          showSuccess('인디케이터가 삭제되었습니다.');
        } catch (err) {
          showError(err);
          throw err;
        }
        return;
      }

      try {
        await deleteChartIndicatorConfig(configNo);
        removeConfig(configNo);
        showSuccess('인디케이터가 삭제되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [removeConfig, isStrategyMode, activeStrategyNo, bumpStrategyIndicatorVersion],
  );

  // Memoize to prevent new array reference on every render
  const activeConfigNos = useMemo(
    () => availableConfigs
      .filter((c) => c.isActive)
      .map((c) => c.userChartIndicatorConfigNo),
    [availableConfigs],
  );

  return {
    configs: availableConfigs,
    activeConfigNos,
    toggleIndicator,
    addIndicator,
    updateIndicator,
    deleteIndicator,
    reload: load,
  };
}
