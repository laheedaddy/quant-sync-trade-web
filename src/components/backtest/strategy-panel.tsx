'use client';

import { useEffect } from 'react';
import { useBacktest } from '@/hooks/use-backtest';
import { useChartStore } from '@/stores/chart-store';
import { StrategyListPanel } from './strategy-list-panel';
import { StrategyDetailPanel } from './strategy-detail-panel';

export function StrategyPanelContent() {
  const {
    detailStrategyNo,
    setDetailStrategyNo,
  } = useBacktest();
  const { symbol, timeframe, setActiveStrategyNo, setViewingVersionNo } = useChartStore();

  // 종목/타임프레임 변경 시 상세뷰 → 목록으로 복귀 + 차트 전략 해제
  useEffect(() => {
    setDetailStrategyNo(null);
    setActiveStrategyNo(null);
    setViewingVersionNo(null);
  }, [symbol, timeframe, setDetailStrategyNo, setActiveStrategyNo, setViewingVersionNo]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {detailStrategyNo !== null ? (
        <StrategyDetailPanel />
      ) : (
        <StrategyListPanel />
      )}
    </div>
  );
}
