'use client';

import type { BacktestTrade } from '@/types/backtest';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BacktestTradeListProps {
  trades: BacktestTrade[];
}

export function BacktestTradeList({ trades }: BacktestTradeListProps) {
  if (trades.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-medium text-[#787b86] mb-2">
        거래 내역 ({trades.length})
      </h4>
      <ScrollArea className="h-[200px]">
        <div className="space-y-1.5">
          {trades.map((trade) => {
            const isWin = (trade.pnl || 0) > 0;
            return (
              <div
                key={trade.backtestTradeNo}
                className="p-2 rounded border border-[#2a2e39] bg-[#1e222d] text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#26a69a] font-medium">BUY</span>
                  {trade.exitDate && (
                    <span
                      className={`font-mono font-medium ${
                        isWin ? 'text-[#26a69a]' : 'text-[#ef5350]'
                      }`}
                    >
                      {isWin ? '+' : ''}
                      {Number(trade.returnPct || 0).toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-[#787b86]">
                  <span>
                    {formatDate(trade.entryDate)} @ {Number(trade.entryPrice).toFixed(2)}
                  </span>
                  {trade.exitDate && (
                    <span>
                      → {formatDate(trade.exitDate)} @ {Number(trade.exitPrice || 0).toFixed(2)}
                    </span>
                  )}
                </div>
                {trade.pnl !== undefined && trade.pnl !== null && (
                  <div className={`text-right font-mono ${isWin ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                    {isWin ? '+' : ''}{Number(trade.pnl).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}
