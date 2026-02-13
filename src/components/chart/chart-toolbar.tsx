'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useChartStore } from '@/stores/chart-store';
import { TIMEFRAMES } from '@/types/chart';
import type { Timeframe } from '@/types/chart';

export function ChartToolbar() {
  const {
    symbol,
    timeframe,
    availableConfigs,
    activeIndicatorConfigNos,
    setSymbol,
    setTimeframe,
    toggleIndicator,
  } = useChartStore();

  const [symbolInput, setSymbolInput] = useState(symbol);

  const handleSymbolSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = symbolInput.trim().toUpperCase();
      if (trimmed && trimmed !== symbol) {
        setSymbol(trimmed);
      }
    },
    [symbolInput, symbol, setSymbol],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-[#2a2e39] bg-[#131722]">
      {/* Symbol Input */}
      <form onSubmit={handleSymbolSubmit} className="flex items-center gap-1">
        <input
          type="text"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          className="w-28 px-2 py-1 text-sm font-mono font-semibold bg-[#0a0e17] border border-[#2a2e39] rounded text-[#d1d4dc] focus:outline-none focus:border-[#555b66]"
          placeholder="AAPL"
        />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
        >
          Go
        </Button>
      </form>

      <Separator orientation="vertical" className="h-6 bg-[#2a2e39]" />

      {/* Timeframe Selector */}
      <div className="flex items-center gap-0.5">
        {TIMEFRAMES.map((tf) => (
          <Button
            key={tf.value}
            variant="ghost"
            size="sm"
            onClick={() => setTimeframe(tf.value as Timeframe)}
            className={`h-7 px-2 text-xs font-mono ${
              timeframe === tf.value
                ? 'text-[#d1d4dc] bg-[#2a2e39]'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#1e222d]'
            }`}
          >
            {tf.label}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 bg-[#2a2e39]" />

      {/* Indicator Toggles */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-[#787b86] mr-1">Indicators:</span>
        {availableConfigs.map((config) => {
          const isActive = activeIndicatorConfigNos.includes(config.indicatorConfigNo);
          return (
            <Badge
              key={config.indicatorConfigNo}
              variant={isActive ? 'default' : 'outline'}
              className={`cursor-pointer text-xs font-mono ${
                isActive
                  ? 'bg-[#2a2e39] text-[#d1d4dc] border-[#555b66] hover:bg-[#363a45]'
                  : 'bg-transparent text-[#787b86] border-[#2a2e39] hover:text-[#d1d4dc] hover:border-[#555b66]'
              }`}
              onClick={() => toggleIndicator(config.indicatorConfigNo)}
            >
              {config.displayName}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
