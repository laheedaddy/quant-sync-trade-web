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
  const stats = [
    {
      label: '총 시그널',
      value: `${run.tradeCount}`,
      color: 'text-[#d1d4dc]',
    },
    {
      label: 'BUY 시그널',
      value: `${run.winCount}`,
      color: 'text-[#26a69a]',
    },
    {
      label: 'SELL 시그널',
      value: `${run.lossCount}`,
      color: 'text-[#ef5350]',
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
      <div className="grid grid-cols-3 gap-2">
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

