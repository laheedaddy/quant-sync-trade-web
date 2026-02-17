'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBacktestStore } from '@/stores/backtest-store';
import { useChartStore } from '@/stores/chart-store';
import { useChartData } from '@/hooks/use-chart-data';
import { useChartIndicators } from '@/hooks/use-chart-indicators';
import { useChartDrawings } from '@/hooks/use-chart-drawings';
import { useChartSettings } from '@/hooks/use-chart-settings';
import { useDrawingStore } from '@/stores/drawing-store';
import type { DrawingSnapshotItem } from '@/types/strategy';
import { useRealtimeQuote } from '@/hooks/use-realtime-quote';
import { ChartSyncManager } from '@/lib/chart/sync';
import { ChartToolbar } from './chart-toolbar';
import { CandlestickChart } from './candlestick-chart';
import { IndicatorPanel } from './indicator-panel';
import { AddIndicatorDialog } from './add-indicator-dialog';
import { isPanelIndicator } from '@/lib/chart/indicators';
import { Toaster } from 'sonner';
import type { UserChartIndicatorConfig } from '@/types/chart';

export function ChartContainer() {
  const { currentTrades } = useBacktestStore();
  const { candles, indicators, isLoading, loadMore, refetch, refreshLatest } = useChartData();
  const syncManagerRef = useRef(new ChartSyncManager());

  // Load chart settings from server
  useChartSettings();

  // Load indicator configs from server
  const { toggleIndicator, deleteIndicator, updateIndicator, activeConfigNos } = useChartIndicators();

  const { availableConfigs, activeStrategyNo, viewingVersionNo, symbol, timeframe } = useChartStore();
  const realtimeQuote = useRealtimeQuote(symbol || null);
  const isStrategyMode = activeStrategyNo !== null;
  const isVersionMode = viewingVersionNo !== null;

  // Load drawings from server
  const { drawings: liveDrawings, saveDrawing, updateDrawingById, removeDrawingById } = useChartDrawings();
  const { toolMode, resetTool, setDrawings: setStoreDrawings } = useDrawingStore();

  // Version mode: override drawings with snapshot data from version store
  // Read directly from backtest-store versions (more reliable than chart API pipeline)
  const versions = useBacktestStore((s) => s.versions);

  // Find the specific version object — null means version not found (still loading or doesn't exist)
  const versionEntry = useMemo(() => {
    if (!isVersionMode || !viewingVersionNo) return null;
    return versions.find(
      (v) => Number(v.userStrategyVersionNo) === Number(viewingVersionNo),
    ) ?? null;
  }, [isVersionMode, viewingVersionNo, versions]);

  const versionDrawingSnapshots = useMemo(() => {
    return versionEntry?.snapshot?.drawingSnapshots as Record<string, DrawingSnapshotItem[]> | undefined;
  }, [versionEntry]);

  useEffect(() => {
    if (!isVersionMode) return;
    // Guard: don't overwrite drawings until the version is actually found in the store
    // (versions may still be loading from API)
    if (!versionEntry) return;

    const key = `${symbol}:${timeframe}`;
    const snapshotItems = versionDrawingSnapshots?.[key] || [];
    const mapped = snapshotItems.map((item, i) => ({
      userChartDrawingNo: -(i + 1), // negative IDs for snapshot drawings
      userNo: 0,
      symbol,
      timeframe,
      userStrategyNo: activeStrategyNo ?? 0,
      drawingType: item.drawingType as import('@/types/chart').DrawingType,
      points: item.points,
      style: item.style as import('@/types/chart').DrawingStyle,
      isDelete: false,
      createdAt: '',
      createdBy: 0,
    }));
    setStoreDrawings(mapped);
  }, [isVersionMode, versionEntry, versionDrawingSnapshots, symbol, timeframe, activeStrategyNo, setStoreDrawings]);

  const drawings = liveDrawings;

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<UserChartIndicatorConfig | null>(null);

  const handleDrawingComplete = useCallback(
    async (request: Parameters<typeof saveDrawing>[0]) => {
      try {
        await saveDrawing(request);
      } catch {
        // error already shown by hook
      }
      resetTool();
    },
    [saveDrawing, resetTool],
  );

  const handleDrawingCancel = useCallback(() => {
    resetTool();
  }, [resetTool]);

  const handleDrawingUpdate = useCallback(
    async (drawingNo: number, points: import('@/types/chart').DrawingPoint[]) => {
      await updateDrawingById(drawingNo, { points });
    },
    [updateDrawingById],
  );

  const handleDrawingDelete = useCallback(
    async (drawingNo: number) => {
      await removeDrawingById(drawingNo);
    },
    [removeDrawingById],
  );

  // Indicator actions for legend/panel hover buttons
  // In version mode, pass undefined (read-only)
  const indicatorActions = useMemo(() => {
    if (isVersionMode) return undefined;
    return {
      onEdit: (configNo: number) => {
        const config = availableConfigs.find(
          (c) => c.userChartIndicatorConfigNo === configNo,
        );
        if (config) {
          setEditingConfig(config);
          setEditDialogOpen(true);
        }
      },
      onToggle: (configNo: number) => {
        toggleIndicator(configNo);
      },
      onDelete: (configNo: number) => {
        deleteIndicator(configNo);
      },
    };
  }, [isVersionMode, availableConfigs, toggleIndicator, deleteIndicator]);

  // Drawing actions for legend hover buttons
  // In version mode, pass undefined (read-only, snapshot drawings)
  const drawingActions = useMemo(() => {
    if (isVersionMode) return undefined;
    return {
      onDelete: (drawingNo: number) => {
        removeDrawingById(drawingNo);
      },
    };
  }, [isVersionMode, removeDrawingById]);

  const handleEditUpdate = useCallback(
    async (_configNo: number, displayName: string, parameters: Record<string, number>) => {
      await updateIndicator(_configNo, { displayName, parameters });
    },
    [updateIndicator],
  );

  // activeConfigNos always passed for visibility toggle (no more undefined bypass)

  const panelIndicators = indicators.filter((ind) => isPanelIndicator(ind.indicatorType));
  const hasPanels = panelIndicators.length > 0;

  // Flex ratio: main chart vs indicator panel (default 4:1)
  const [chartFlexRatio, setChartFlexRatio] = useState(4);
  const chartAreaRef = useRef<HTMLDivElement>(null);

  const handleIndicatorResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = chartAreaRef.current;
      if (!container) return;

      const startY = e.clientY;
      const startRatio = chartFlexRatio;
      const containerHeight = container.clientHeight;

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientY - startY;
        const currentIndicatorHeight = containerHeight / (startRatio + 1);
        const newIndicatorHeight = Math.max(40, Math.min(containerHeight * 0.5, currentIndicatorHeight - delta));
        const newMainHeight = containerHeight - newIndicatorHeight;
        setChartFlexRatio(Math.max(1, newMainHeight / newIndicatorHeight));
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [chartFlexRatio],
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0e17]">
      <ChartToolbar />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Chart area */}
        <div ref={chartAreaRef} className="flex-1 min-h-[200px] flex flex-col overflow-hidden relative">
          <Toaster
            theme="dark"
            position="top-center"
            offset={12}
            toastOptions={{
              style: { background: '#1e222d', border: '1px solid #2a2e39', color: '#d1d4dc' },
            }}
          />
          {/* Main candlestick chart — flex ratio (default 4) */}
          <div style={{ flex: hasPanels ? chartFlexRatio : 1 }} className="min-h-0 overflow-hidden">
            <CandlestickChart
              candles={candles}
              indicators={indicators}
              isLoading={isLoading}
              onVisibleTimeRangeChange={loadMore}
              syncManager={syncManagerRef.current}
              backtestTrades={currentTrades}
              drawings={drawings}
              toolMode={toolMode}
              onDrawingComplete={handleDrawingComplete}
              onDrawingCancel={handleDrawingCancel}
              onDrawingUpdate={handleDrawingUpdate}
              onDrawingDelete={handleDrawingDelete}
              indicatorActions={indicatorActions}
              activeConfigNos={activeConfigNos}
              drawingActions={drawingActions}
              realtimeQuote={realtimeQuote}
              onRefetch={refreshLatest}
            />
          </div>

          {/* Resize handle between main chart and indicator panels */}
          {hasPanels && (
            <div
              onMouseDown={handleIndicatorResizeStart}
              className="h-1 cursor-row-resize hover:bg-[#2962ff] bg-[#2a2e39] flex-shrink-0 transition-colors"
            />
          )}

          {/* Indicator panels — flex ratio 1 (default 4:1 with main chart) */}
          {hasPanels && (
            <div style={{ flex: 1 }} className="min-h-0 overflow-hidden">
              <IndicatorPanel
                candles={candles}
                indicators={indicators}
                syncManager={syncManagerRef.current}
                indicatorActions={indicatorActions}
                activeConfigNos={activeConfigNos}
              />
            </div>
          )}
        </div>

      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-[#2a2e39] bg-[#131722]">
        <span className="text-xs font-mono text-[#787b86]">
          {candles.length} candles loaded
        </span>
        {isLoading && (
          <span className="text-xs font-mono text-[#787b86] animate-pulse">
            Loading...
          </span>
        )}
      </div>

      {/* Edit Indicator Dialog */}
      <AddIndicatorDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingConfig(null);
        }}
        editingConfig={editingConfig}
        onSubmit={async () => {}}
        onUpdate={handleEditUpdate}
      />
    </div>
  );
}
