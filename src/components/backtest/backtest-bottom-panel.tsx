// @ts-nocheck — This file is kept for reference. Bottom panel is replaced by StrategyDetailPanel.
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useBacktestStore } from '@/stores/backtest-store';
import { useBacktest } from '@/hooks/use-backtest';
import { useStrategies } from '@/hooks/use-strategies';
import { useChartStore } from '@/stores/chart-store';
import { useStrategyVersions } from '@/hooks/use-strategy-versions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BacktestResultsSummary } from './backtest-results-summary';
import { BacktestTradeList } from './backtest-trade-list';
import { BacktestHistoryTable } from './backtest-history-table';
import { BacktestConditionLogTable } from './backtest-condition-log-table';
import { StrategyEditor } from '@/components/strategy/strategy-editor';
import { Play, Calendar, DollarSign, RotateCcw } from 'lucide-react';
import type { GetUserStrategyVersionDto, VersionSnapshot } from '@/types/strategy';

function buildMajorMinorCounts(versions: GetUserStrategyVersionDto[]): Map<number, number> {
  const sorted = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
  const counts = new Map<number, number>();
  let currentMajorNo: number | null = null;

  for (const v of sorted) {
    if (v.versionType === 'MAJOR') {
      currentMajorNo = v.userStrategyVersionNo;
      counts.set(currentMajorNo, 0);
    } else if (currentMajorNo !== null) {
      counts.set(currentMajorNo, (counts.get(currentMajorNo) ?? 0) + 1);
    }
  }

  return counts;
}

export function BacktestBottomPanel() {
  const {
    bottomPanelHeight,
    bottomPanelTab,
    setBottomPanelHeight,
    setBottomPanelTab,
  } = useBacktestStore();

  const { symbol: chartSymbol, timeframe: chartTimeframe } = useChartStore();
  const { strategies } = useStrategies();
  const {
    selectedStrategyNo,
    setSelectedStrategyNo,
    currentRun,
    currentTrades,
    isRunning,
    history,
    isLoadingHistory,
    run,
    loadHistory,
    loadRun,
    removeRun,
  } = useBacktest();
  const {
    versions,
    selectedVersionNo,
    setSelectedVersionNo,
    loadVersions,
  } = useStrategyVersions();

  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [initialCapital, setInitialCapital] = useState('10000000');
  const [editorKey, setEditorKey] = useState(0);

  // Resize state
  const resizeRef = useRef<{ startY: number; startHeight: number } | null>(null);

  // Load versions when strategy changes
  useEffect(() => {
    if (selectedStrategyNo) {
      loadVersions(selectedStrategyNo);
      setSelectedVersionNo(null);
    }
  }, [selectedStrategyNo, loadVersions, setSelectedVersionNo]);

  // Load history when strategy/symbol/timeframe changes and history tab is active
  useEffect(() => {
    if (selectedStrategyNo && bottomPanelTab === 'history') {
      loadHistory(selectedStrategyNo, { symbol: chartSymbol, timeframe: chartTimeframe });
    }
  }, [selectedStrategyNo, bottomPanelTab, chartSymbol, chartTimeframe, loadHistory]);

  const handleStrategyChange = (value: string) => {
    setSelectedStrategyNo(Number(value));
  };

  const handleVersionChange = (value: string) => {
    if (value === 'latest') {
      setSelectedVersionNo(null);
    } else {
      setSelectedVersionNo(Number(value));
    }
  };

  const handleRun = async () => {
    if (!selectedStrategyNo) return;
    try {
      await run(
        selectedStrategyNo,
        startDate,
        endDate,
        Number(initialCapital) || undefined,
        selectedVersionNo ?? undefined,
      );
      // Refresh history after run
      loadHistory(selectedStrategyNo, { symbol: chartSymbol, timeframe: chartTimeframe });
    } catch {
      // error handled in hook
    }
  };

  const handleSelectHistoryRun = useCallback(
    async (backtestRunNo: number) => {
      await loadRun(backtestRunNo);
      setBottomPanelTab('overview');
    },
    [loadRun, setBottomPanelTab],
  );

  const handleDeleteHistoryRun = useCallback(
    async (backtestRunNo: number) => {
      await removeRun(backtestRunNo);
    },
    [removeRun],
  );

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeRef.current = { startY: e.clientY, startHeight: bottomPanelHeight };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const delta = resizeRef.current.startY - ev.clientY;
        const newHeight = Math.min(600, Math.max(150, resizeRef.current.startHeight + delta));
        setBottomPanelHeight(newHeight);
      };

      const handleMouseUp = () => {
        resizeRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [bottomPanelHeight, setBottomPanelHeight],
  );

  // Version dropdown helpers
  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => a.versionNumber - b.versionNumber),
    [versions],
  );

  const majorMinorCounts = useMemo(
    () => buildMajorMinorCounts(versions),
    [versions],
  );

  const getVersionLabel = (v: GetUserStrategyVersionDto) => {
    if (v.versionType === 'MAJOR') {
      const minorCount = majorMinorCounts.get(v.userStrategyVersionNo) ?? 0;
      const desc = v.description ? ` - ${v.description}` : '';
      return `v${v.versionNumber} MAJOR (${minorCount} minor)${desc}`;
    }
    const desc = v.description ? ` - ${v.description}` : '';
    return `d${v.versionNumber} MINOR${desc}`;
  };

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'history' as const, label: 'History' },
    { key: 'debug' as const, label: 'Debug' },
    { key: 'edit' as const, label: 'Edit' },
  ];

  return (
    <div
      style={{ height: bottomPanelHeight }}
      className="flex-shrink-0 flex flex-col border-t border-[#2a2e39] bg-[#131722]"
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="h-1 cursor-row-resize hover:bg-[#2962ff] bg-[#2a2e39] flex-shrink-0 transition-colors"
      />

      {/* Toolbar Row */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#2a2e39] flex-shrink-0">
        {/* Strategy dropdown */}
        <Select
          value={selectedStrategyNo?.toString() ?? ''}
          onValueChange={handleStrategyChange}
        >
          <SelectTrigger className="w-40 h-7 text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
            <SelectValue placeholder="Strategy..." />
          </SelectTrigger>
          <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
            {strategies.map((s) => (
              <SelectItem
                key={s.userStrategyNo}
                value={s.userStrategyNo.toString()}
                className="text-xs text-[#d1d4dc]"
              >
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Version dropdown */}
        <Select
          value={selectedVersionNo?.toString() ?? 'latest'}
          onValueChange={handleVersionChange}
          disabled={!selectedStrategyNo}
        >
          <SelectTrigger className="w-48 h-7 text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
            <SelectValue placeholder="Version..." />
          </SelectTrigger>
          <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
            <SelectItem value="latest" className="text-xs text-[#26a69a]">
              Latest (Live)
            </SelectItem>
            {sortedVersions.length > 0 && <SelectSeparator />}
            {sortedVersions.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[10px] text-[#787b86]">Versions</SelectLabel>
                {sortedVersions.map((v) => (
                  <SelectItem
                    key={v.userStrategyVersionNo}
                    value={v.userStrategyVersionNo.toString()}
                    className={`text-xs ${
                      v.versionType === 'MAJOR' ? 'text-[#2962ff]' : 'text-[#ff9800]'
                    }`}
                  >
                    {getVersionLabel(v)}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>

        <span className="text-[#2a2e39]">|</span>

        {/* Date range */}
        <Calendar className="w-3.5 h-3.5 text-[#787b86] flex-shrink-0" />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-32 h-7 text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-32 h-7 text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]"
        />

        {/* Capital */}
        <DollarSign className="w-3.5 h-3.5 text-[#787b86] flex-shrink-0" />
        <Input
          type="number"
          value={initialCapital}
          onChange={(e) => setInitialCapital(e.target.value)}
          className="w-28 h-7 text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]"
        />

        {/* Run button */}
        <Button
          onClick={handleRun}
          disabled={isRunning || !selectedStrategyNo}
          size="sm"
          className="h-7 px-3 text-xs bg-[#2962ff] hover:bg-[#2962ff]/80 text-white gap-1.5"
        >
          {isRunning ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Run
            </>
          )}
        </Button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-0 border-b border-[#2a2e39] flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setBottomPanelTab(tab.key)}
            className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 ${
              bottomPanelTab === tab.key
                ? 'text-[#d1d4dc] border-[#2962ff]'
                : 'text-[#787b86] border-transparent hover:text-[#d1d4dc]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {bottomPanelTab === 'overview' && (
          <OverviewContent
            currentRun={currentRun}
            currentTrades={currentTrades}
          />
        )}
        {bottomPanelTab === 'debug' && (
          <BacktestConditionLogTable />
        )}
        {bottomPanelTab === 'history' && (
          <BacktestHistoryTable
            history={history}
            onSelectRun={handleSelectHistoryRun}
            onDeleteRun={handleDeleteHistoryRun}
          />
        )}
        {bottomPanelTab === 'edit' && selectedStrategyNo && !selectedVersionNo && (
          <div className="p-3 overflow-auto h-full">
            <StrategyEditor
              key={editorKey}
              strategyNo={selectedStrategyNo}
              onChanged={() => loadVersions(selectedStrategyNo)}
              hideSettings
            />
          </div>
        )}
        {bottomPanelTab === 'edit' && selectedStrategyNo && selectedVersionNo && (
          <VersionSnapshotView
            version={versions.find((v) => Number(v.userStrategyVersionNo) === Number(selectedVersionNo)) ?? null}
            strategyNo={selectedStrategyNo}
            onRestored={() => {
              setSelectedVersionNo(null);
              setEditorKey((k) => k + 1);
              loadVersions(selectedStrategyNo);
            }}
          />
        )}
        {bottomPanelTab === 'edit' && !selectedStrategyNo && (
          <div className="flex-1 flex items-center justify-center h-full">
            <p className="text-sm text-[#787b86]">Select a strategy to edit.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewContent({
  currentRun,
  currentTrades,
}: {
  currentRun: ReturnType<typeof useBacktestStore.getState>['currentRun'];
  currentTrades: ReturnType<typeof useBacktestStore.getState>['currentTrades'];
}) {
  if (!currentRun) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-[#787b86]">Run a backtest to see results</p>
      </div>
    );
  }

  if (currentRun.status === 'FAILED') {
    return (
      <div className="p-4">
        <div className="p-3 rounded border border-[#ef5350]/30 bg-[#ef5350]/5">
          <p className="text-xs text-[#ef5350]">
            Backtest failed: {currentRun.errorMessage || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: Results Summary */}
      <div className="flex-1 p-3 overflow-auto border-r border-[#2a2e39]">
        <BacktestResultsSummary run={currentRun} />
      </div>
      {/* Right: Trade List */}
      <div className="flex-1 p-3 overflow-auto">
        <BacktestTradeList trades={currentTrades} />
      </div>
    </div>
  );
}

function VersionSnapshotView({
  version,
  strategyNo,
  onRestored,
}: {
  version: GetUserStrategyVersionDto | null;
  strategyNo: number;
  onRestored: () => void;
}) {
  const { handleRestoreVersion } = useStrategyVersions();
  const [restoring, setRestoring] = useState(false);

  if (!version) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-[#787b86]">Version not found.</p>
      </div>
    );
  }

  const { snapshot } = version;
  const versionLabel =
    version.versionType === 'MAJOR'
      ? `v${version.versionNumber}`
      : `d${version.versionNumber}`;
  const versionColor =
    version.versionType === 'MAJOR' ? 'text-[#2962ff]' : 'text-[#ff9800]';

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await handleRestoreVersion(strategyNo, version.userStrategyVersionNo);
      onRestored();
    } catch {
      // error handled in hook
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Snapshot info */}
      <div className="flex-1 p-3 overflow-auto border-r border-[#2a2e39]">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-sm font-mono font-semibold ${versionColor}`}>
            {versionLabel}
          </span>
          <span className="text-xs text-[#787b86]">
            {version.versionType} · {new Date(version.createdAt).toLocaleDateString()}
          </span>
          {version.description && (
            <span className="text-xs text-[#d1d4dc]">— {version.description}</span>
          )}
          <Button
            onClick={handleRestore}
            disabled={restoring}
            size="sm"
            variant="outline"
            className="ml-auto h-6 px-2 text-[10px] gap-1 border-[#2a2e39] text-[#d1d4dc] hover:bg-[#2a2e39]"
          >
            <RotateCcw className="w-3 h-3" />
            {restoring ? 'Restoring...' : 'Restore to Live'}
          </Button>
        </div>

        {/* Indicators */}
        <div className="mb-3">
          <h4 className="text-[10px] text-[#787b86] mb-1.5 uppercase tracking-wider">
            Indicators ({snapshot.indicators.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {snapshot.indicators.map((ind, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#1e222d] border border-[#2a2e39]"
              >
                <span className="text-[#26a69a] font-medium font-mono">
                  {ind.indicatorType}
                </span>
                <span className="text-[#d1d4dc]">{ind.displayName}</span>
                <span className="text-[#787b86] text-[10px]">
                  ({Object.entries(ind.parameters).map(([k, v]) => `${k}=${v}`).join(', ')})
                </span>
              </span>
            ))}
            {snapshot.indicators.length === 0 && (
              <span className="text-xs text-[#787b86]">No indicators</span>
            )}
          </div>
        </div>

        {/* Rules */}
        <div>
          <h4 className="text-[10px] text-[#787b86] mb-1.5 uppercase tracking-wider">
            Rules (BUY {snapshot.buyRules.length} / SELL {snapshot.sellRules.length})
          </h4>
          <div className="space-y-1">
            {[...snapshot.buyRules.map((r) => ({ ...r, side: 'BUY' as const })),
              ...snapshot.sellRules.map((r) => ({ ...r, side: 'SELL' as const }))
            ].map((rule, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1 rounded text-xs bg-[#1e222d] border border-[#2a2e39]"
              >
                <span
                  className={`font-medium font-mono ${
                    rule.side === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]'
                  }`}
                >
                  {rule.side}
                </span>
                <span className="text-[#787b86]">P{rule.priority}</span>
                <span className="text-[10px] text-[#787b86] truncate">
                  {summarizeConditions(rule.conditions)}
                </span>
              </div>
            ))}
            {snapshot.buyRules.length === 0 && snapshot.sellRules.length === 0 && (
              <span className="text-xs text-[#787b86]">No rules</span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Raw snapshot JSON (compact) */}
      <div className="w-[300px] p-3 overflow-auto">
        <h4 className="text-[10px] text-[#787b86] mb-1.5 uppercase tracking-wider">
          Snapshot Data
        </h4>
        <pre className="text-[10px] font-mono text-[#787b86] whitespace-pre-wrap break-all">
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function summarizeConditions(conditions: Record<string, unknown>): string {
  const group = conditions as { logic?: string; conditions?: unknown[] };
  if (group.logic && group.conditions) {
    return `${group.logic} (${group.conditions.length} conditions)`;
  }
  return JSON.stringify(conditions).slice(0, 80);
}
