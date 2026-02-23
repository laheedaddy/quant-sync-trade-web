'use client';

import type { BacktestTrade } from '@/types/backtest';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface BacktestTradeListProps {
  trades: BacktestTrade[];
}

export function BacktestTradeList({ trades }: BacktestTradeListProps) {
  if (trades.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-medium text-[#787b86] mb-2">
        시그널 타임라인 ({trades.length})
      </h4>
      <ScrollArea className="h-[200px]">
        <div className="space-y-1">
          {trades.map((trade) => {
            const isBuy = trade.tradeType === 'BUY';
            return (
              <div
                key={trade.backtestTradeNo}
                className="flex items-center gap-2 px-2 py-1.5 rounded border border-[#2a2e39] bg-[#1e222d] text-xs"
              >
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${
                    isBuy
                      ? 'bg-[#26a69a]/20 text-[#26a69a] border-[#26a69a]/30'
                      : 'bg-[#ef5350]/20 text-[#ef5350] border-[#ef5350]/30'
                  }`}
                >
                  {trade.tradeType}
                </Badge>
                <span className="text-[#d1d4dc] font-mono">
                  {Number(trade.entryPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                </span>
                <span className="text-[#787b86] ml-auto shrink-0">
                  {formatDate(trade.entryDate)}
                </span>
                {trade.entryRuleNo != null && (
                  <span className="text-[10px] text-[#787b86] shrink-0">
                    R#{trade.entryRuleNo}
                  </span>
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
  const mon = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${mon}/${day} ${h}:${m}`;
}
