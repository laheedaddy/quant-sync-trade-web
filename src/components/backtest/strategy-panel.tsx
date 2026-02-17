'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBacktest } from '@/hooks/use-backtest';
import { useChartStore } from '@/stores/chart-store';
import { StrategyListPanel } from './strategy-list-panel';
import { StrategyDetailPanel } from './strategy-detail-panel';

export function StrategyPanel() {
  const {
    panelOpen,
    setPanelOpen,
    detailStrategyNo,
    setDetailStrategyNo,
    sidePanelWidth,
    setSidePanelWidth,
  } = useBacktest();
  const { symbol, timeframe, setActiveStrategyNo, setViewingVersionNo } = useChartStore();

  // 종목/타임프레임 변경 시 상세뷰 → 목록으로 복귀 + 차트 전략 해제
  useEffect(() => {
    setDetailStrategyNo(null);
    setActiveStrategyNo(null);
    setViewingVersionNo(null);
  }, [symbol, timeframe, setDetailStrategyNo, setActiveStrategyNo, setViewingVersionNo]);

  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeRef.current = { startX: e.clientX, startWidth: sidePanelWidth };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const delta = resizeRef.current.startX - ev.clientX;
        const newWidth = Math.min(800, Math.max(300, resizeRef.current.startWidth + delta));
        setSidePanelWidth(newWidth);
      };

      const handleMouseUp = () => {
        resizeRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [sidePanelWidth, setSidePanelWidth],
  );

  return (
    <div className="relative flex">
      {/* Toggle button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute -left-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-6 h-12 bg-[#1e222d] border border-[#2a2e39] border-r-0 rounded-l hover:bg-[#2a2e39] transition-colors"
      >
        {panelOpen ? (
          <ChevronRight className="w-4 h-4 text-[#787b86]" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-[#787b86]" />
        )}
      </button>

      {panelOpen && (
        <>
          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className="w-1 cursor-col-resize hover:bg-[#2962ff] bg-[#2a2e39] flex-shrink-0 transition-colors"
          />

          <div
            style={{ width: sidePanelWidth }}
            className="h-full border-l border-[#2a2e39] bg-[#131722] flex flex-col overflow-hidden"
          >
            {detailStrategyNo !== null ? (
              <StrategyDetailPanel />
            ) : (
              <StrategyListPanel />
            )}
          </div>
        </>
      )}
    </div>
  );
}
