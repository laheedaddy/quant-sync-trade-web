'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBacktestStore } from '@/stores/backtest-store';
import { useBacktest } from '@/hooks/use-backtest';
import { useStrategies } from '@/hooks/use-strategies';
import { useChartStore } from '@/stores/chart-store';
import { useStrategyVersions } from '@/hooks/use-strategy-versions';
import { showInfo } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { BacktestConditionLogTable } from './backtest-condition-log-table';
import { StrategyEditor } from '@/components/strategy/strategy-editor';
import { useSignalChannels } from '@/hooks/use-signal-channels';
import { ChannelCard } from '@/components/signal-channel/channels-tab';
import { CreateChannelDialog } from '@/components/signal-channel/create-channel-dialog';
import { ChannelDetailView } from '@/components/signal-channel/channel-detail-view';
import type { SignalChannel } from '@/types/signal-channel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, ArrowUp, Check, Pencil, Play, RotateCcw, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { GetUserStrategyVersionDto } from '@/types/strategy';
import type { BacktestRun } from '@/types/backtest';

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

export function StrategyDetailPanel() {
  const {
    detailStrategyNo,
    detailTab,
    setDetailStrategyNo,
    setDetailTab,
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
    loadConditionLogs,
  } = useBacktest();

  const setCurrentRun = useBacktestStore((s) => s.setCurrentRun);
  const setCurrentTrades = useBacktestStore((s) => s.setCurrentTrades);

  const { strategies, update: updateStrategy } = useStrategies();
  const {
    symbol: chartSymbol,
    timeframe: chartTimeframe,
    priceScaleMode,
    setActiveStrategyNo,
    setViewingVersionNo,
    autoVersionCounter,
  } = useChartStore();
  const {
    versions,
    selectedVersionNo,
    setSelectedVersionNo,
    loadVersions,
    handlePromoteVersion,
    handleCreateMajorFromLatest,
  } = useStrategyVersions();
  const strategy = strategies.find((s) => s.userStrategyNo === detailStrategyNo);

  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [initialCapital, setInitialCapital] = useState('10000000');
  const [editorKey, setEditorKey] = useState(0);
  const [historyVersionFilter, setHistoryVersionFilter] = useState<string>('all');
  const [configCollapsed, setConfigCollapsed] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteDesc, setPromoteDesc] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync selectedStrategyNo when detailStrategyNo changes
  useEffect(() => {
    if (detailStrategyNo && detailStrategyNo !== selectedStrategyNo) {
      setSelectedStrategyNo(detailStrategyNo);
    }
  }, [detailStrategyNo, selectedStrategyNo, setSelectedStrategyNo]);

  // Load versions when strategy changes
  useEffect(() => {
    if (detailStrategyNo) {
      loadVersions(detailStrategyNo);
      setSelectedVersionNo(null);
      setViewingVersionNo(null);
    }
  }, [detailStrategyNo, loadVersions, setSelectedVersionNo, setViewingVersionNo]);

  // Reload versions when auto-version is created (e.g. drawing change)
  useEffect(() => {
    if (detailStrategyNo && autoVersionCounter > 0) {
      loadVersions(detailStrategyNo);
    }
  }, [detailStrategyNo, autoVersionCounter, loadVersions]);

  // Load history when backtest tab is active or strategy changes
  useEffect(() => {
    if (detailStrategyNo && detailTab === 'backtest') {
      loadHistory(detailStrategyNo, { symbol: chartSymbol, timeframe: chartTimeframe });
    }
  }, [detailStrategyNo, detailTab, chartSymbol, chartTimeframe, loadHistory]);

  // Auto-load condition logs when a run is selected
  useEffect(() => {
    if (currentRun?.backtestRunNo) {
      loadConditionLogs(currentRun.backtestRunNo);
    }
  }, [currentRun?.backtestRunNo, loadConditionLogs]);

  const startEditing = () => {
    if (!strategy) return;
    setEditName(strategy.name);
    setEditDesc(strategy.description || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = async () => {
    if (!detailStrategyNo || !editName.trim()) return;
    setSaving(true);
    try {
      await updateStrategy(detailStrategyNo, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      setIsEditing(false);
    } catch {
      // error handled in hook
    } finally {
      setSaving(false);
    }
  };

  const handleVersionChange = (value: string) => {
    if (value === 'latest') {
      setSelectedVersionNo(null);
      setViewingVersionNo(null);
    } else {
      const versionNo = Number(value);
      setSelectedVersionNo(versionNo);
      setViewingVersionNo(versionNo);
    }
  };

  const handleRun = async () => {
    if (!detailStrategyNo) return;
    try {
      await run(
        detailStrategyNo,
        startDate,
        endDate,
        Number(initialCapital) || undefined,
        selectedVersionNo ?? undefined,
      );
      loadHistory(detailStrategyNo, { symbol: chartSymbol, timeframe: chartTimeframe });
    } catch {
      // error handled in hook
    }
  };

  const handleSelectHistoryRun = useCallback(
    async (backtestRunNo: number) => {
      await loadRun(backtestRunNo);
    },
    [loadRun],
  );

  const handleBackToList = useCallback(() => {
    setCurrentRun(null);
    setCurrentTrades([]);
  }, [setCurrentRun, setCurrentTrades]);

  const handleDeleteHistoryRun = useCallback(
    async (backtestRunNo: number) => {
      await removeRun(backtestRunNo);
    },
    [removeRun],
  );

  // Promote handler
  const selectedVersion = selectedVersionNo
    ? versions.find(v => Number(v.userStrategyVersionNo) === Number(selectedVersionNo))
    : null;
  const latestVersion = versions.length > 0
    ? [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0]
    : null;
  const canPromote = selectedVersionNo === null
    ? latestVersion?.versionType !== 'MAJOR'  // Latest: 가장 최근 버전이 MAJOR이면 승격 불필요
    : selectedVersion?.versionType === 'MINOR';

  const handlePromote = async () => {
    setPromoting(true);
    try {
      let created;
      if (selectedVersionNo === null) {
        created = await handleCreateMajorFromLatest(detailStrategyNo!, promoteDesc || undefined);
      } else {
        created = await handlePromoteVersion(selectedVersionNo, promoteDesc || undefined);
      }
      setPromoteDialogOpen(false);
      setPromoteDesc('');
      loadVersions(detailStrategyNo!);
      if (created) {
        setSelectedVersionNo(created.userStrategyVersionNo);
        setViewingVersionNo(created.userStrategyVersionNo);
      }
    } catch {
      // error handled in hook
    } finally {
      setPromoting(false);
    }
  };

  // Version dropdown helpers
  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.versionNumber - a.versionNumber),
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

  // Filtered history based on version filter
  const filteredHistory = useMemo(() => {
    if (historyVersionFilter === 'all') return history;
    const filterNo = Number(historyVersionFilter);
    return history.filter((r) => Number(r.userStrategyVersionNo) === filterNo);
  }, [history, historyVersionFilter]);

  const scaleLabel = priceScaleMode === 1 ? 'Log' : 'Normal';

  const tabs = [
    { key: 'backtest' as const, label: 'Backtest' },
    { key: 'edit' as const, label: 'Edit' },
    { key: 'channel' as const, label: 'Channel' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Back button + Strategy header */}
      <div className="px-3 pt-2 pb-1.5 border-b border-[#2a2e39] flex-shrink-0">
        <button
          onClick={() => {
            setDetailStrategyNo(null);
            setActiveStrategyNo(null);
            setViewingVersionNo(null);
            showInfo('기본 차트로 전환');
          }}
          className="flex items-center gap-1 text-xs text-[#787b86] hover:text-[#d1d4dc] mb-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          목록으로
        </button>
        {strategy && !isEditing && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#d1d4dc] truncate">
                {strategy.name}
              </span>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={startEditing}
                  className="p-0.5 text-[#787b86] hover:text-[#d1d4dc] transition-colors"
                  title="전략 수정"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <Badge
                  variant="outline"
                  className={`text-[9px] h-4 ${
                    strategy.isActive
                      ? 'border-[#26a69a]/50 text-[#26a69a]'
                      : 'border-[#787b86]/50 text-[#787b86]'
                  }`}
                >
                  {strategy.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            {strategy.description && (
              <p className="text-[10px] text-[#787b86] line-clamp-2">{strategy.description}</p>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-[#d1d4dc]">
                {strategy.symbol}
              </span>
              <span className="text-[10px] text-[#787b86]">·</span>
              <span className="text-[11px] font-mono text-[#787b86]">
                {strategy.timeframe}
              </span>
              <Badge
                variant="outline"
                className={`text-[9px] h-4 ${
                  priceScaleMode === 1
                    ? 'border-[#ff9800]/50 text-[#ff9800]'
                    : 'border-[#787b86]/40 text-[#787b86]'
                }`}
              >
                {scaleLabel}
              </Badge>
            </div>
          </div>
        )}
        {strategy && isEditing && (
          <div className="space-y-1.5">
            <div>
              <label className="text-[9px] text-[#787b86] mb-0.5 block">이름</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[9px] text-[#787b86] mb-0.5 block">설명</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="전략 설명..."
                rows={2}
                className="w-full px-2 py-1.5 text-xs bg-[#0a0e17] border border-[#2a2e39] rounded text-[#d1d4dc] resize-none focus:outline-none focus:border-[#2962ff]"
              />
            </div>
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="p-1 text-[#787b86] hover:text-[#d1d4dc] transition-colors"
                title="취소"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={saveEditing}
                disabled={saving || !editName.trim()}
                className="p-1 text-[#26a69a] hover:text-[#26a69a]/80 transition-colors disabled:opacity-40"
                title="저장"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Version selector (global) */}
      <div className="px-3 py-1.5 border-b border-[#2a2e39] flex-shrink-0">
        <Select
          value={selectedVersionNo?.toString() ?? 'latest'}
          onValueChange={handleVersionChange}
        >
          <SelectTrigger className="w-full h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]">
            <SelectValue placeholder="Version..." />
          </SelectTrigger>
          <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
            <SelectItem value="latest" className="text-xs text-[#26a69a]">
              Latest
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
        {canPromote && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Button
              onClick={() => setPromoteDialogOpen(true)}
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px] gap-1 border-[#2962ff]/50 text-[#2962ff] hover:bg-[#2962ff]/10"
            >
              <ArrowUp className="w-3 h-3" />
              {selectedVersionNo === null ? 'Save as MAJOR' : 'Promote to MAJOR'}
            </Button>
          </div>
        )}
        <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
          <DialogContent className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">
                {selectedVersionNo === null ? 'Save as MAJOR' : 'Promote to MAJOR'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs text-[#787b86]">설명 (선택)</label>
                <textarea
                  value={promoteDesc}
                  onChange={(e) => setPromoteDesc(e.target.value)}
                  placeholder="이 버전에 대한 메모..."
                  className="mt-1 w-full h-20 px-2 py-1.5 text-xs bg-[#0a0e17] border border-[#2a2e39] rounded text-[#d1d4dc] resize-none focus:outline-none focus:border-[#2962ff]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setPromoteDialogOpen(false); setPromoteDesc(''); }}
                className="text-[#787b86]"
              >
                취소
              </Button>
              <Button
                onClick={handlePromote}
                disabled={promoting}
                className="bg-[#2962ff] hover:bg-[#1e53e5] text-white"
              >
                {promoting ? '처리 중...' : selectedVersionNo === null ? '생성' : '승격'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-0 border-b border-[#2a2e39] flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setDetailTab(tab.key)}
            className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 ${
              detailTab === tab.key
                ? 'text-[#d1d4dc] border-[#2962ff]'
                : 'text-[#787b86] border-transparent hover:text-[#d1d4dc]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {detailTab === 'backtest' && !currentRun && (
          <div className="flex flex-col h-full">
            {/* ── Run Configuration ── */}
            <div className="flex-shrink-0 border-b border-[#2a2e39]">
              {/* Config header - always visible, acts as collapse toggle */}
              <button
                onClick={() => setConfigCollapsed((c) => !c)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#1e222d]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-[#787b86] uppercase tracking-wider">
                    Run Config
                  </span>
                  {configCollapsed && (
                    <span className="text-[10px] text-[#787b86]">
                      {startDate.slice(5)} ~ {endDate.slice(5)} · ₩{Number(initialCapital).toLocaleString()}
                    </span>
                  )}
                </div>
                {configCollapsed
                  ? <ChevronDown className="w-3.5 h-3.5 text-[#787b86]" />
                  : <ChevronUp className="w-3.5 h-3.5 text-[#787b86]" />
                }
              </button>

              {/* Config body - collapsible */}
              {!configCollapsed && (
                <div className="px-3 pb-2.5 space-y-2">
                  {/* Date range */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="text-[9px] text-[#787b86] mb-0.5 block">시작일</span>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-[#787b86] mb-0.5 block">종료일</span>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
                      />
                    </div>
                  </div>

                  {/* Capital + Run */}
                  <div className="flex items-end gap-1.5">
                    <div className="flex-1">
                      <span className="text-[9px] text-[#787b86] mb-0.5 block">초기자본</span>
                      <Input
                        type="number"
                        value={initialCapital}
                        onChange={(e) => setInitialCapital(e.target.value)}
                        className="h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
                      />
                    </div>
                    <Button
                      onClick={handleRun}
                      disabled={isRunning || !detailStrategyNo}
                      size="sm"
                      className="h-7 px-4 text-xs bg-[#2962ff] hover:bg-[#2962ff]/80 text-white gap-1.5 shrink-0"
                    >
                      {isRunning ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Running
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          Run
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ── History Section ── */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2e39] flex-shrink-0">
              <span className="text-[10px] font-medium text-[#787b86] uppercase tracking-wider">
                History
                {!isLoadingHistory && (
                  <span className="ml-1 text-[#d1d4dc] normal-case">
                    ({filteredHistory.length})
                  </span>
                )}
              </span>
              <Select value={historyVersionFilter} onValueChange={setHistoryVersionFilter}>
                <SelectTrigger className="w-24 h-6 text-[10px] bg-transparent border-[#2a2e39] text-[#787b86] px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                  <SelectItem value="all" className="text-xs text-[#d1d4dc]">
                    전체
                  </SelectItem>
                  {sortedVersions.length > 0 && <SelectSeparator />}
                  {sortedVersions.map((v) => (
                    <SelectItem
                      key={v.userStrategyVersionNo}
                      value={v.userStrategyVersionNo.toString()}
                      className={`text-xs ${
                        v.versionType === 'MAJOR' ? 'text-[#2962ff]' : 'text-[#ff9800]'
                      }`}
                    >
                      {v.versionType === 'MAJOR' ? `v${v.versionNumber}` : `d${v.versionNumber}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* History list (scrollable) */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <HistoryCards
                  history={filteredHistory}
                  isLoadingHistory={isLoadingHistory}
                  versions={versions}
                  onSelectRun={handleSelectHistoryRun}
                  onDeleteRun={handleDeleteHistoryRun}
                />
              </ScrollArea>
            </div>
          </div>
        )}

        {detailTab === 'backtest' && currentRun && (
          <BacktestDetailView
            currentRun={currentRun}
            currentTrades={currentTrades}
            versions={versions}
            onBack={handleBackToList}
          />
        )}

        {detailTab === 'edit' && detailStrategyNo && !selectedVersionNo && (
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              <div className="p-2 rounded border border-[#2962ff]/30 bg-[#2962ff]/5">
                <p className="text-[10px] text-[#2962ff]">
                  인디케이터와 드로잉은 차트 툴바에서 관리합니다. 현재 스케일: {scaleLabel}
                </p>
              </div>
              <StrategyEditor
                key={editorKey}
                strategyNo={detailStrategyNo}
                onChanged={() => {
                  loadVersions(detailStrategyNo);
                }}
                hideSettings
                hideIndicators
              />
            </div>
          </ScrollArea>
        )}
        {detailTab === 'edit' && detailStrategyNo && selectedVersionNo && (
          <VersionSnapshotView
            version={versions.find((v) => Number(v.userStrategyVersionNo) === Number(selectedVersionNo)) ?? null}
            strategyNo={detailStrategyNo}
            onRestored={() => {
              setSelectedVersionNo(null);
              setViewingVersionNo(null);
              setEditorKey((k) => k + 1);
              loadVersions(detailStrategyNo);
            }}
          />
        )}
        {detailTab === 'edit' && !detailStrategyNo && (
          <div className="flex-1 flex items-center justify-center h-full">
            <p className="text-sm text-[#787b86]">Select a strategy to edit.</p>
          </div>
        )}

        {detailTab === 'channel' && detailStrategyNo && strategy && (
          <StrategyChannelContent
            strategyNo={detailStrategyNo}
            symbol={strategy.symbol}
            timeframe={strategy.timeframe}
          />
        )}
      </div>
    </div>
  );
}

// ─── Strategy Channel Content ───

function StrategyChannelContent({
  strategyNo,
  symbol,
  timeframe,
}: {
  strategyNo: number;
  symbol: string;
  timeframe: string;
}) {
  const {
    channels,
    isLoadingChannels,
    reload,
  } = useSignalChannels(strategyNo);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<SignalChannel | null>(null);

  // ── Detail View ──
  if (selectedChannel) {
    return (
      <ChannelDetailView
        strategyNo={strategyNo}
        channel={selectedChannel}
        onBack={() => setSelectedChannel(null)}
      />
    );
  }

  // ── List View ──
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2e39] flex-shrink-0">
        <span className="text-[10px] font-medium text-[#787b86] uppercase tracking-wider">
          Signal Channels
          {!isLoadingChannels && (
            <span className="ml-1 text-[#d1d4dc] normal-case">({channels.length})</span>
          )}
        </span>
        <Button
          size="sm"
          className="h-6 text-[10px] px-2 bg-[#2962ff] hover:bg-[#1e53e5] text-white"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-3 h-3 mr-1" />
          New Channel
        </Button>
      </div>

      {/* Channel List */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          {isLoadingChannels ? (
            <div className="p-2 space-y-1.5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-14 w-full bg-[#1e222d] rounded animate-pulse" />
              ))}
            </div>
          ) : channels.length === 0 ? (
            <div className="flex items-center justify-center min-h-[160px]">
              <p className="text-xs text-[#787b86]">
                채널이 없습니다. New Channel로 시그널 채널을 생성하세요.
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1.5">
              {channels.map((channel) => (
                <ChannelCard
                  key={channel.signalChannelNo}
                  channel={channel}
                  onClick={() => setSelectedChannel(channel)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <CreateChannelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        strategyNo={strategyNo}
        symbol={symbol}
        timeframe={timeframe}
        onCreated={reload}
      />
    </div>
  );
}

// ─── History Cards ───

function HistoryCards({
  history,
  isLoadingHistory,
  versions,
  onSelectRun,
  onDeleteRun,
}: {
  history: BacktestRun[];
  isLoadingHistory: boolean;
  versions: GetUserStrategyVersionDto[];
  onSelectRun: (backtestRunNo: number) => void;
  onDeleteRun: (backtestRunNo: number) => void;
}) {
  if (isLoadingHistory) {
    return (
      <div className="p-2 space-y-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[60px] w-full bg-[#1e222d] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[160px]">
        <p className="text-xs text-[#787b86]">이력이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1.5">
      {history.map((run) => {
        const isPositive = Number(run.totalReturn) > 0;
        const returnColor = isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]';

        const versionLabel = (() => {
          if (!run.userStrategyVersionNo) return 'Live';
          const ver = versions.find(
            (v) => Number(v.userStrategyVersionNo) === Number(run.userStrategyVersionNo),
          );
          if (!ver) return `#${run.userStrategyVersionNo}`;
          return ver.versionType === 'MAJOR' ? `v${ver.versionNumber}` : `d${ver.versionNumber}`;
        })();

        const versionColor = (() => {
          if (!run.userStrategyVersionNo) return 'text-[#26a69a]';
          const ver = versions.find(
            (v) => Number(v.userStrategyVersionNo) === Number(run.userStrategyVersionNo),
          );
          if (!ver) return 'text-[#787b86]';
          return ver.versionType === 'MAJOR' ? 'text-[#2962ff]' : 'text-[#ff9800]';
        })();

        return (
          <div
            key={run.backtestRunNo}
            className="p-2.5 rounded border border-[#2a2e39] bg-[#1e222d] cursor-pointer hover:border-[#787b86] transition-colors group"
            onClick={() => onSelectRun(run.backtestRunNo)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-mono font-medium ${versionColor}`}>
                  {versionLabel}
                </span>
                <span className="text-xs text-[#d1d4dc]">
                  {run.symbol} · {run.timeframe}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono font-medium ${returnColor}`}>
                  {isPositive ? '+' : ''}
                  {Number(run.totalReturn).toFixed(2)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRun(run.backtestRunNo);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#787b86] hover:text-[#ef5350]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#787b86]">
              <span>
                {formatDateRange(run.startDate, run.endDate)}
              </span>
              <span>
                W{Number(run.winRate).toFixed(0)}% · {run.tradeCount}trades
              </span>
            </div>
            {run.strategySnapshot && (
              <div className="text-[10px] text-[#787b86] mt-0.5">
                {run.strategySnapshot.indicators.length} indicators ·{' '}
                {run.strategySnapshot.buyRules.length}B/{run.strategySnapshot.sellRules.length}S rules
              </div>
            )}
            <div className="text-[10px] text-[#787b86] mt-0.5">
              {new Date(run.createdAt).toLocaleDateString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Backtest Detail View (when a run is selected) ───

function BacktestDetailView({
  currentRun,
  currentTrades,
  versions,
  onBack,
}: {
  currentRun: BacktestRun;
  currentTrades: ReturnType<typeof useBacktestStore.getState>['currentTrades'];
  versions: GetUserStrategyVersionDto[];
  onBack: () => void;
}) {
  const versionLabel = (() => {
    if (!currentRun.userStrategyVersionNo) return 'Live';
    const ver = versions.find(
      (v) => Number(v.userStrategyVersionNo) === Number(currentRun.userStrategyVersionNo),
    );
    if (!ver) return `#${currentRun.userStrategyVersionNo}`;
    return ver.versionType === 'MAJOR' ? `v${ver.versionNumber}` : `d${ver.versionNumber}`;
  })();

  const isPositive = Number(currentRun.totalReturn) > 0;
  const returnColor = isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]';

  if (currentRun.status === 'FAILED') {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 border-b border-[#2a2e39] flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-[#787b86] hover:text-[#d1d4dc]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            목록으로
          </button>
        </div>
        <div className="p-4">
          <div className="p-3 rounded border border-[#ef5350]/30 bg-[#ef5350]/5">
            <p className="text-xs text-[#ef5350]">
              Backtest failed: {currentRun.errorMessage || 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button + run summary */}
      <div className="px-3 py-2 border-b border-[#2a2e39] flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-[#787b86] hover:text-[#d1d4dc] mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          목록으로
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-medium text-[#d1d4dc]">
            {versionLabel}
          </span>
          <span className="text-[10px] text-[#787b86]">
            {formatDateRange(currentRun.startDate, currentRun.endDate)}
          </span>
          <span className={`text-sm font-mono font-medium ${returnColor}`}>
            {isPositive ? '+' : ''}
            {Number(currentRun.totalReturn).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Results + Trades + Debug logs */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-3">
            <BacktestResultsSummary run={currentRun} />
            <BacktestTradeList trades={currentTrades} />
            <div>
              <h4 className="text-[10px] text-[#787b86] mb-1.5 uppercase tracking-wider">
                Condition Logs
              </h4>
              <BacktestConditionLogTable />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ─── Version Snapshot View ───

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
      <div className="flex items-center justify-center h-full min-h-[200px]">
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
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Version header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-mono font-semibold ${versionColor}`}>
            {versionLabel}
          </span>
          <span className="text-xs text-[#787b86]">
            {version.versionType} · {new Date(version.createdAt).toLocaleDateString()}
          </span>
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

        {/* Read-only notice */}
        <div className="p-2 rounded border border-[#ff9800]/30 bg-[#ff9800]/5">
          <p className="text-[10px] text-[#ff9800]">
            과거 버전은 읽기 전용입니다. 수정하려면 &quot;Restore to Live&quot;를 눌러 현재 상태로 복원한 뒤 편집하세요.
          </p>
        </div>

        {version.description && (
          <p className="text-xs text-[#d1d4dc]">{version.description}</p>
        )}

        {/* Indicators */}
        <div>
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

        {/* Drawings */}
        {snapshot.drawingSnapshots && Object.keys(snapshot.drawingSnapshots).length > 0 && (
          <div>
            <h4 className="text-[10px] text-[#787b86] mb-1.5 uppercase tracking-wider">
              Drawings
            </h4>
            <div className="space-y-1">
              {Object.entries(snapshot.drawingSnapshots).map(([key, items]) => (
                <div key={key} className="px-2 py-1 rounded text-xs bg-[#1e222d] border border-[#2a2e39]">
                  <span className="text-[#787b86] font-mono">{key}</span>
                  <span className="text-[#d1d4dc] ml-2">{(items as unknown[]).length} drawings</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Snapshot Data */}
        <div>
          <h4 className="text-[10px] text-[#787b86] mb-1.5 uppercase tracking-wider">
            Snapshot Data
          </h4>
          <pre className="text-[10px] font-mono text-[#787b86] whitespace-pre-wrap break-all p-2 rounded bg-[#1e222d] border border-[#2a2e39]">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </div>
      </div>
    </ScrollArea>
  );
}

function summarizeConditions(conditions: Record<string, unknown> | undefined): string {
  if (!conditions) return '(empty)';
  const group = conditions as { logic?: string; conditions?: unknown[] };
  if (group.logic && group.conditions) {
    return `${group.logic} (${group.conditions.length} conditions)`;
  }
  return JSON.stringify(conditions).slice(0, 80);
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
  return `${fmt(s)} ~ ${fmt(e)}`;
}
