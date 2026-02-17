'use client';

import { useEffect } from 'react';
import { useBacktest } from '@/hooks/use-backtest';
import { useBacktestStore } from '@/stores/backtest-store';
import { useChartStore } from '@/stores/chart-store';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';

export function HistoryTab() {
  const {
    selectedStrategyNo,
    history,
    isLoadingHistory,
    loadHistory,
    loadRun,
    removeRun,
  } = useBacktest();
  const { versions } = useBacktestStore();
  const { symbol, timeframe } = useChartStore();

  useEffect(() => {
    if (selectedStrategyNo) {
      loadHistory(selectedStrategyNo, { symbol, timeframe });
    }
  }, [selectedStrategyNo, symbol, timeframe, loadHistory]);

  if (!selectedStrategyNo) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-[#787b86]">전략을 먼저 선택하세요.</p>
      </div>
    );
  }

  if (isLoadingHistory) {
    return (
      <div className="p-3 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-[#1e222d]" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-[#787b86]">백테스트 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1.5">
      {history.map((run) => {
        const isPositive = Number(run.totalReturn) > 0;
        const returnColor = isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]';

        return (
          <div
            key={run.backtestRunNo}
            className="p-2.5 rounded border border-[#2a2e39] bg-[#1e222d] cursor-pointer hover:border-[#787b86] transition-colors group"
            onClick={() => loadRun(run.backtestRunNo)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#d1d4dc]">
                {run.symbol} · {run.timeframe}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono font-medium ${returnColor}`}>
                  {isPositive ? '+' : ''}
                  {Number(run.totalReturn).toFixed(2)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRun(run.backtestRunNo);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#787b86] hover:text-[#ef5350]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#787b86]">
              <span>
                {formatDateRange(run.startDate, run.endDate)}
              </span>
              <span>
                W{Number(run.winRate).toFixed(0)}% · {run.tradeCount}trades
              </span>
            </div>
            {run.strategySnapshot && (
              <div className="text-[10px] text-[#787b86] mt-0.5">
                {run.strategySnapshot.indicators.length} indicators ·{' '}
                {run.strategySnapshot.buyRules.length}B/{run.strategySnapshot.sellRules.length}S rules
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] text-[#787b86] mt-0.5">
              <span>{new Date(run.createdAt).toLocaleDateString()}</span>
              {run.userStrategyVersionNo && (() => {
                const ver = versions.find(
                  (v) => Number(v.userStrategyVersionNo) === Number(run.userStrategyVersionNo),
                );
                return ver ? (
                  <span className="text-[#2962ff] font-mono">v{ver.versionNumber}</span>
                ) : (
                  <span className="font-mono">v?</span>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
  return `${fmt(s)} ~ ${fmt(e)}`;
}
