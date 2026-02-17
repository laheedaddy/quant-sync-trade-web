'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChartStore } from '@/stores/chart-store';
import { fetchChartSettings, updateChartSettings } from '@/lib/api/chart-settings';
import type { UpdateChartSettingsRequest } from '@/types/chart';

export function useChartSettings() {
  const {
    symbol,
    timeframe,
    activeStrategyNo,
    setCandleDisplayType,
    setPriceScaleMode,
    setShowReferenceLines,
  } = useChartStore();

  const userStrategyNo = activeStrategyNo ?? 0;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load settings when symbol/timeframe/strategy changes
  useEffect(() => {
    fetchChartSettings(symbol, timeframe, userStrategyNo)
      .then((settings) => {
        setCandleDisplayType(settings.candleDisplayType);
        setPriceScaleMode(settings.priceScaleMode);
        setShowReferenceLines(settings.showReferenceLines);
      })
      .catch(() => {
        // Keep defaults on error
      });
  }, [symbol, timeframe, userStrategyNo, setCandleDisplayType, setPriceScaleMode, setShowReferenceLines]);

  // Save settings with debounce
  const saveSettings = useCallback(
    (body: UpdateChartSettingsRequest) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        updateChartSettings(symbol, timeframe, body, userStrategyNo).catch(() => {
          // Silently fail - local state already updated
        });
      }, 500);
    },
    [symbol, timeframe, userStrategyNo],
  );

  return { saveSettings };
}
