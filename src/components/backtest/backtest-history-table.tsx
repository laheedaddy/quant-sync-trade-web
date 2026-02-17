'use client';

import { useBacktestStore } from '@/stores/backtest-store';
import { Trash2 } from 'lucide-react';
import type { BacktestRun } from '@/types/backtest';

interface BacktestHistoryTableProps {
  history: BacktestRun[];
  onSelectRun: (backtestRunNo: number) => void;
  onDeleteRun: (backtestRunNo: number) => void;
}

export function BacktestHistoryTable({ history, onSelectRun, onDeleteRun }: BacktestHistoryTableProps) {
  const { versions } = useBacktestStore();

  if (history.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[#787b86]">No backtest history yet.</p>
      </div>
    );
  }

  const getVersionLabel = (run: BacktestRun) => {
    if (!run.userStrategyVersionNo) return 'Live';
    const ver = versions.find((v) => Number(v.userStrategyVersionNo) === Number(run.userStrategyVersionNo));
    if (!ver) return `#${run.userStrategyVersionNo}`;
    if (ver.versionType === 'MAJOR') return `v${ver.versionNumber}`;
    return `d${ver.versionNumber}`;
  };

  const getVersionColor = (run: BacktestRun) => {
    if (!run.userStrategyVersionNo) return 'text-[#26a69a]';
    const ver = versions.find((v) => Number(v.userStrategyVersionNo) === Number(run.userStrategyVersionNo));
    if (!ver) return 'text-[#787b86]';
    return ver.versionType === 'MAJOR' ? 'text-[#2962ff]' : 'text-[#ff9800]';
  };

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#131722] z-10">
          <tr className="text-[10px] text-[#787b86] border-b border-[#2a2e39]">
            <th className="text-left px-3 py-1.5 font-normal">Version</th>
            <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
            <th className="text-left px-3 py-1.5 font-normal">Period</th>
            <th className="text-right px-3 py-1.5 font-normal">Capital</th>
            <th className="text-right px-3 py-1.5 font-normal">Return</th>
            <th className="text-right px-3 py-1.5 font-normal">PnL</th>
            <th className="text-right px-3 py-1.5 font-normal">Win Rate</th>
            <th className="text-right px-3 py-1.5 font-normal">Trades</th>
            <th className="text-right px-3 py-1.5 font-normal">Max DD</th>
            <th className="text-right px-3 py-1.5 font-normal">Date</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {history.map((run) => {
            const isPositive = Number(run.totalReturn) > 0;
            const returnColor = isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]';

            return (
              <tr
                key={run.backtestRunNo}
                className="border-b border-[#2a2e39]/50 hover:bg-[#1e222d] cursor-pointer group transition-colors"
                onClick={() => onSelectRun(run.backtestRunNo)}
              >
                <td className="px-3 py-1.5">
                  <span className={`font-mono font-medium ${getVersionColor(run)}`}>
                    {getVersionLabel(run)}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-[#d1d4dc] font-mono">{run.symbol}</td>
                <td className="px-3 py-1.5 text-[#787b86]">
                  {formatDateShort(run.startDate)} ~ {formatDateShort(run.endDate)}
                </td>
                <td className="px-3 py-1.5 text-right text-[#d1d4dc] font-mono">
                  {Number(run.initialCapital).toLocaleString()}
                </td>
                <td className={`px-3 py-1.5 text-right font-mono font-medium ${returnColor}`}>
                  {isPositive ? '+' : ''}{Number(run.totalReturn).toFixed(2)}%
                </td>
                <td className={`px-3 py-1.5 text-right font-mono ${returnColor}`}>
                  {isPositive ? '+' : ''}{Number(run.totalPnl).toLocaleString()}
                </td>
                <td className="px-3 py-1.5 text-right text-[#d1d4dc] font-mono">
                  {Number(run.winRate).toFixed(1)}%
                </td>
                <td className="px-3 py-1.5 text-right text-[#d1d4dc] font-mono">
                  {run.tradeCount}
                </td>
                <td className="px-3 py-1.5 text-right text-[#ef5350] font-mono">
                  -{Number(run.maxDrawdown).toFixed(2)}%
                </td>
                <td className="px-3 py-1.5 text-right text-[#787b86]">
                  {new Date(run.createdAt).toLocaleDateString()}
                </td>
                <td className="px-1 py-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRun(run.backtestRunNo);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#787b86] hover:text-[#ef5350]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
}
