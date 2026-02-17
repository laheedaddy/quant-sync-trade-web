'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useChartStore } from '@/stores/chart-store';
import { useDrawingStore } from '@/stores/drawing-store';
import {
  fetchChartDrawings,
  addChartDrawing,
  updateChartDrawing,
  deleteChartDrawing,
} from '@/lib/api/chart-drawing';
import { triggerAutoVersion } from '@/lib/api/strategy-version';
import type { CreateChartDrawingRequest, UpdateChartDrawingRequest } from '@/types/chart';
import { showError, showSuccess } from '@/lib/toast';

export function useChartDrawings() {
  const { symbol, timeframe, activeStrategyNo, viewingVersionNo, bumpAutoVersionCounter, bumpStrategyIndicatorVersion } = useChartStore();
  const { drawings, setDrawings, addDrawing, updateDrawing, removeDrawing, refreshVersion } = useDrawingStore();

  const userStrategyNo = activeStrategyNo ?? 0;
  const isVersionMode = viewingVersionNo !== null;

  // Debounced auto-version for strategy mode
  const debouncedAutoVersionRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Abort controller to cancel stale live drawing fetches on version switch
  const abortRef = useRef<AbortController | null>(null);

  const scheduleAutoVersion = useCallback(() => {
    if (!activeStrategyNo) return;
    clearTimeout(debouncedAutoVersionRef.current);
    debouncedAutoVersionRef.current = setTimeout(async () => {
      try {
        await triggerAutoVersion(activeStrategyNo, '드로잉 변경');
        bumpAutoVersionCounter();
      } catch { /* ignore */ }
    }, 2000);
  }, [activeStrategyNo, bumpAutoVersionCounter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debouncedAutoVersionRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const load = useCallback(async () => {
    // Abort any in-flight live drawing fetch to prevent stale data overwriting snapshot
    abortRef.current?.abort();

    // Skip loading live drawings in version mode (snapshot drawings are set by chart-container)
    if (isVersionMode) return;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await fetchChartDrawings(symbol, timeframe, userStrategyNo);
      // Check if this request was superseded by a newer one (e.g. version switch)
      if (controller.signal.aborted) return;
      setDrawings(result);
    } catch {
      if (controller.signal.aborted) return;
      setDrawings([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe, userStrategyNo, isVersionMode, setDrawings]);

  // Reload when dependencies change OR when refreshVersion is bumped (e.g. priceScaleMode toggle)
  useEffect(() => {
    load();
    // Schedule auto-version when refreshVersion is bumped (skip initial render)
    if (refreshVersion > 0 && activeStrategyNo) {
      bumpStrategyIndicatorVersion();
      scheduleAutoVersion();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, refreshVersion]);

  const saveDrawing = useCallback(
    async (body: CreateChartDrawingRequest) => {
      try {
        const created = await addChartDrawing(symbol, timeframe, body, userStrategyNo);
        addDrawing(created);

        if (activeStrategyNo) bumpStrategyIndicatorVersion();
        scheduleAutoVersion();
        return created;
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [symbol, timeframe, userStrategyNo, addDrawing, activeStrategyNo, bumpStrategyIndicatorVersion, scheduleAutoVersion],
  );

  const updateDrawingById = useCallback(
    async (drawingNo: number, body: UpdateChartDrawingRequest) => {
      try {
        const updated = await updateChartDrawing(drawingNo, body);
        updateDrawing(drawingNo, updated);
        if (activeStrategyNo) bumpStrategyIndicatorVersion();
        scheduleAutoVersion();
        return updated;
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [updateDrawing, activeStrategyNo, bumpStrategyIndicatorVersion, scheduleAutoVersion],
  );

  const removeDrawingById = useCallback(
    async (drawingNo: number) => {
      try {
        await deleteChartDrawing(drawingNo);
        removeDrawing(drawingNo);
        if (activeStrategyNo) bumpStrategyIndicatorVersion();
        scheduleAutoVersion();
        showSuccess('드로잉이 삭제되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [removeDrawing, activeStrategyNo, bumpStrategyIndicatorVersion, scheduleAutoVersion],
  );

  return {
    drawings,
    saveDrawing,
    updateDrawingById,
    removeDrawingById,
    reload: load,
  };
}
