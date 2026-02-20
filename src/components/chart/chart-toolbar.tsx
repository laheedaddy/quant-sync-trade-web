'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChartStore } from '@/stores/chart-store';
import { useBacktestStore } from '@/stores/backtest-store';
import { useChartIndicators } from '@/hooks/use-chart-indicators';
import { useRealtimeQuote } from '@/hooks/use-realtime-quote';
import { TIMEFRAMES } from '@/types/chart';
import type { Timeframe, CandleDisplayType } from '@/types/chart';
import { BarChart3, FlaskConical, LineChart, AreaChart, Ruler, TrendingUp, CandlestickChart, ChevronDown, MoveUpRight, Minus } from 'lucide-react';
import type { DrawingToolMode } from '@/types/chart';
import { useDrawingStore } from '@/stores/drawing-store';
import { AddIndicatorDialog } from './add-indicator-dialog';
import { SymbolSearchDialog } from './symbol-search-dialog';
import { updateChartSettings } from '@/lib/api/chart-settings';
import { updateDrawingsPriceScaleMode } from '@/lib/api/chart-drawing';

const CANDLE_TYPE_OPTIONS: { value: CandleDisplayType; label: string; icon: React.ReactNode }[] = [
  { value: 'candles', label: 'Candles', icon: <CandlestickChart className="w-4 h-4" /> },
  { value: 'heikin_ashi', label: 'Heikin Ashi', icon: <BarChart3 className="w-4 h-4" /> },
  { value: 'line', label: 'Line', icon: <LineChart className="w-4 h-4" /> },
  { value: 'area', label: 'Area', icon: <AreaChart className="w-4 h-4" /> },
];

export function ChartToolbar() {
  const {
    symbol,
    timeframe,
    showReferenceLines,
    candleDisplayType,
    priceScaleMode,
    activeStrategyNo,
    viewingVersionNo,
    setSymbol,
    setTimeframe,
    setShowReferenceLines,
    setCandleDisplayType,
    setPriceScaleMode,
  } = useChartStore();

  const isVersionMode = viewingVersionNo !== null;

  const { addIndicator } = useChartIndicators();

  const quote = useRealtimeQuote(symbol);

  const { panelOpen, activePanel, setPanelOpen, setActivePanel } = useBacktestStore();
  const { toolMode, setToolMode, resetTool, bumpRefreshVersion } = useDrawingStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const userStrategyNo = activeStrategyNo ?? 0;

  const handleSymbolSelect = useCallback(
    (sym: string) => {
      if (sym !== symbol) {
        setSymbol(sym);
      }
    },
    [symbol, setSymbol],
  );

  const handleAddSubmit = useCallback(
    async (indicatorType: string, displayName: string, parameters: Record<string, number>, colors?: Record<string, string> | null, lineWidths?: Record<string, number> | null) => {
      await addIndicator({ indicatorType, displayName, parameters: parameters as Record<string, unknown>, colors: colors ?? null, lineWidths: lineWidths ?? null });
    },
    [addIndicator],
  );

  const handleCandleTypeChange = useCallback(
    (type: CandleDisplayType) => {
      setCandleDisplayType(type);
      updateChartSettings(symbol, timeframe, { candleDisplayType: type }, userStrategyNo).catch(() => {});
    },
    [symbol, timeframe, userStrategyNo, setCandleDisplayType],
  );

  const handlePriceScaleModeToggle = useCallback(() => {
    const newMode = priceScaleMode === 0 ? 1 : 0;
    setPriceScaleMode(newMode as 0 | 1);
    updateChartSettings(symbol, timeframe, { priceScaleMode: newMode }, userStrategyNo).catch(() => {});
    // Batch update all drawings' style.priceScaleMode + indicator configs, then trigger reload
    updateDrawingsPriceScaleMode(symbol, timeframe, newMode, userStrategyNo)
      .then(() => bumpRefreshVersion())
      .catch(() => {});
  }, [symbol, timeframe, userStrategyNo, priceScaleMode, setPriceScaleMode, bumpRefreshVersion]);

  const handleRefLinesToggle = useCallback(() => {
    const newVal = !showReferenceLines;
    setShowReferenceLines(newVal);
    updateChartSettings(symbol, timeframe, { showReferenceLines: newVal }, userStrategyNo).catch(() => {});
  }, [symbol, timeframe, userStrategyNo, showReferenceLines, setShowReferenceLines]);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-[#2a2e39] bg-[#131722]">
        {/* Symbol Button → opens search dialog */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSearchOpen(true)}
          className="h-7 px-2 gap-1 text-sm font-mono font-semibold text-[#d1d4dc] hover:bg-[#2a2e39]"
        >
          {symbol}
          <ChevronDown className="w-3 h-3 text-[#787b86]" />
        </Button>

        {/* Realtime Price */}
        {quote && (
          <>
            <Separator orientation="vertical" className="h-5 bg-[#2a2e39]" />
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[#d1d4dc] font-semibold">
                {quote.price.toFixed(2)}
              </span>
              {quote.change != null && quote.changePercent != null && (
                <span
                  className={
                    quote.change >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'
                  }
                >
                  {quote.change >= 0 ? '+' : ''}
                  {quote.change.toFixed(2)} ({quote.change >= 0 ? '+' : ''}
                  {quote.changePercent.toFixed(2)}%)
                </span>
              )}
            </div>
          </>
        )}

        <Separator orientation="vertical" className="h-5 bg-[#2a2e39]" />

        {/* Timeframe Selector */}
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map((tf) => (
            <Button
              key={tf.value}
              variant="ghost"
              size="sm"
              onClick={() => setTimeframe(tf.value as Timeframe)}
              className={`h-7 px-1.5 text-xs font-mono ${
                timeframe === tf.value
                  ? 'text-[#d1d4dc] bg-[#2a2e39]'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#1e222d]'
              }`}
            >
              {tf.label}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-5 bg-[#2a2e39]" />

        {/* Candle Type Dropdown — icon only */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isVersionMode}
                  className="h-7 w-7 p-0 text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] disabled:opacity-40"
                >
                  {CANDLE_TYPE_OPTIONS.find((o) => o.value === candleDisplayType)?.icon}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-[#1e222d] text-[#d1d4dc] border-[#2a2e39]">
              {CANDLE_TYPE_OPTIONS.find((o) => o.value === candleDisplayType)?.label}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="start"
            className="bg-[#1e222d] border-[#2a2e39] min-w-[140px]"
          >
            {CANDLE_TYPE_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleCandleTypeChange(option.value)}
                className={`text-xs gap-2 cursor-pointer ${
                  candleDisplayType === option.value
                    ? 'text-[#d1d4dc] bg-[#2a2e39]'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                {option.icon}
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Indicators — icon only */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isVersionMode}
              onClick={() => setDialogOpen(true)}
              className="h-7 w-7 p-0 text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] disabled:opacity-40"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#1e222d] text-[#d1d4dc] border-[#2a2e39]">
            Indicators
          </TooltipContent>
        </Tooltip>

        {/* Drawing Tools — dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isVersionMode}
                  className={`h-7 w-7 p-0 ${
                    toolMode !== 'none'
                      ? 'bg-[#2962ff] text-white hover:bg-[#1e53e5]'
                      : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
                  } disabled:opacity-40`}
                >
                  {toolMode === 'ray' ? <MoveUpRight className="w-4 h-4" /> :
                   toolMode === 'horizontal_line' ? <Minus className="w-4 h-4" /> :
                   <TrendingUp className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-[#1e222d] text-[#d1d4dc] border-[#2a2e39]">
              Drawing Tools
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="start"
            className="bg-[#1e222d] border-[#2a2e39] min-w-[160px]"
          >
            {([
              { mode: 'parallel_channel' as DrawingToolMode, label: 'Parallel Channel', icon: <TrendingUp className="w-4 h-4" /> },
              { mode: 'ray' as DrawingToolMode, label: 'Ray', icon: <MoveUpRight className="w-4 h-4" /> },
              { mode: 'horizontal_line' as DrawingToolMode, label: 'Horizontal Line', icon: <Minus className="w-4 h-4" /> },
            ]).map((tool) => (
              <DropdownMenuItem
                key={tool.mode}
                onClick={() => {
                  if (toolMode === tool.mode) {
                    resetTool();
                  } else {
                    setToolMode(tool.mode);
                  }
                }}
                className={`text-xs gap-2 cursor-pointer ${
                  toolMode === tool.mode
                    ? 'text-[#d1d4dc] bg-[#2a2e39]'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                {tool.icon}
                {tool.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-5 bg-[#2a2e39]" />

        {/* Reference Lines Toggle — icon only */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefLinesToggle}
              className={`h-7 w-7 p-0 ${
                showReferenceLines
                  ? 'bg-[#2a2e39] text-[#d1d4dc]'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#1e222d]'
              }`}
            >
              <Ruler className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#1e222d] text-[#d1d4dc] border-[#2a2e39]">
            Ref Lines
          </TooltipContent>
        </Tooltip>

        {/* Log Scale Toggle — text (TradingView style) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isVersionMode}
              onClick={handlePriceScaleModeToggle}
              className={`h-7 px-2 text-xs font-mono ${
                priceScaleMode === 1
                  ? 'bg-[#2a2e39] text-[#d1d4dc]'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#1e222d]'
              } disabled:opacity-40`}
            >
              Log
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#1e222d] text-[#d1d4dc] border-[#2a2e39]">
            Logarithmic Scale
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5 bg-[#2a2e39]" />

        {/* Strategy Tester — icon only */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (panelOpen && activePanel === 'strategy') {
                  setPanelOpen(false);
                } else {
                  setActivePanel('strategy');
                  setPanelOpen(true);
                }
              }}
              className={`h-7 w-7 p-0 ${
                panelOpen && activePanel === 'strategy'
                  ? 'bg-[#2a2e39] text-[#d1d4dc]'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#1e222d]'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#1e222d] text-[#d1d4dc] border-[#2a2e39]">
            Strategy Tester
          </TooltipContent>
        </Tooltip>

        {/* Dialogs */}
        <AddIndicatorDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleAddSubmit}
        />
        <SymbolSearchDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onSelect={handleSymbolSelect}
        />
      </div>
    </TooltipProvider>
  );
}
