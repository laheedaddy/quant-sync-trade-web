'use client';

import { useBacktestStore } from '@/stores/backtest-store';
import type { BacktestRun } from '@/types/backtest';

interface BacktestResultsSummaryProps {
  run: BacktestRun;
}

export function BacktestResultsSummary({ run }: BacktestResultsSummaryProps) {
  const { versions } = useBacktestStore();
  const versionInfo = run.userStrategyVersionNo
    ? versions.find((v) => Number(v.userStrategyVersionNo) === Number(run.userStrategyVersionNo))
    : null;
  const isPositive = Number(run.totalReturn) > 0;
  const returnColor = isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]';

  const stats = [
    {
      label: '수익률',
      value: `${isPositive ? '+' : ''}${Number(run.totalReturn).toFixed(2)}%`,
      color: returnColor,
    },
    {
      label: '손익',
      value: `${isPositive ? '+' : ''}${Number(run.totalPnl).toLocaleString()}`,
      color: returnColor,
    },
    {
      label: '승률',
      value: `${Number(run.winRate).toFixed(1)}%`,
      color: 'text-[#d1d4dc]',
    },
    {
      label: '거래 수',
      value: `${run.tradeCount} (W${run.winCount}/L${run.lossCount})`,
      color: 'text-[#d1d4dc]',
    },
    {
      label: '최대 낙폭',
      value: `-${Number(run.maxDrawdown).toFixed(2)}%`,
      color: 'text-[#ef5350]',
    },
    {
      label: '평균 보유',
      value: formatDuration(Number(run.avgTradeDuration)),
      color: 'text-[#d1d4dc]',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-[#787b86]">결과 요약</h4>
        {versionInfo && (
          <span className="text-[10px] font-mono text-[#2962ff]">
            v{versionInfo.versionNumber}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-2 rounded border border-[#2a2e39] bg-[#1e222d]"
          >
            <p className="text-[10px] text-[#787b86]">{stat.label}</p>
            <p className={`text-sm font-mono font-medium ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {run.strategySnapshot && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-[#787b86] mb-2">Strategy Snapshot</h4>
          <div className="p-2 rounded border border-[#2a2e39] bg-[#1e222d] space-y-2">
            <div>
              <p className="text-[10px] text-[#787b86] mb-1">지표</p>
              <div className="flex flex-wrap gap-1">
                {run.strategySnapshot.indicators.map((ind, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#2a2e39] text-[#d1d4dc]"
                  >
                    <span className="text-[#26a69a] font-medium">{ind.indicatorType}</span>
                    {ind.displayName}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-[#787b86]">
              BUY {run.strategySnapshot.buyRules.length}개 / SELL {run.strategySnapshot.sellRules.length}개 규칙
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}
