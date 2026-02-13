'use client';

import type { ChartCandle, ChartIndicator } from '@/types/chart';
import { formatPrice } from '@/lib/utils/format';
import { INDICATOR_COLORS } from '@/lib/chart/theme';

interface ChartLegendProps {
  candle: ChartCandle | null;
  indicators: ChartIndicator[];
}

export function ChartLegend({ candle, indicators }: ChartLegendProps) {
  if (!candle) return null;

  const isUp = candle.closePrice >= candle.openPrice;
  const changeColor = isUp ? '#26a69a' : '#ef5350';

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
      {/* OHLCV */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <span className="text-[#787b86]">O</span>
        <span style={{ color: changeColor }}>{formatPrice(candle.openPrice)}</span>
        <span className="text-[#787b86]">H</span>
        <span style={{ color: changeColor }}>{formatPrice(candle.highPrice)}</span>
        <span className="text-[#787b86]">L</span>
        <span style={{ color: changeColor }}>{formatPrice(candle.lowPrice)}</span>
        <span className="text-[#787b86]">C</span>
        <span style={{ color: changeColor }}>{formatPrice(candle.closePrice)}</span>
      </div>

      {/* Overlay Indicator Values */}
      {indicators
        .filter((ind) => ['MA', 'EMA', 'BOLLINGER'].includes(ind.indicatorType))
        .map((ind) => (
          <IndicatorLegendLine key={ind.indicatorConfigNo} indicator={ind} />
        ))}
    </div>
  );
}

function IndicatorLegendLine({ indicator }: { indicator: ChartIndicator }) {
  const lastData = indicator.data[indicator.data.length - 1];
  if (!lastData) return null;

  const color = getIndicatorColor(indicator.indicatorType);

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span style={{ color }} className="font-semibold">
        {indicator.displayName}
      </span>
      {Object.entries(lastData.value).map(([key, val]) => (
        <span key={key} style={{ color }} className="opacity-80">
          {typeof val === 'number' ? formatPrice(val) : String(val)}
        </span>
      ))}
    </div>
  );
}

function getIndicatorColor(type: string): string {
  switch (type) {
    case 'MA': return INDICATOR_COLORS.MA;
    case 'EMA': return INDICATOR_COLORS.EMA;
    case 'BOLLINGER': return INDICATOR_COLORS.BOLLINGER_MIDDLE;
    case 'RSI': return INDICATOR_COLORS.RSI;
    case 'MACD': return INDICATOR_COLORS.MACD_LINE;
    case 'STOCHASTIC': return INDICATOR_COLORS.STOCHASTIC_K;
    default: return '#d1d4dc';
  }
}
