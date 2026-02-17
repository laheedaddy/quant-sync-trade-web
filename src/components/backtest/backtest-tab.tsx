'use client';

import { useState, useEffect, useMemo } from 'react';
import { useBacktest } from '@/hooks/use-backtest';
import { useStrategies } from '@/hooks/use-strategies';
import { useStrategyVersions } from '@/hooks/use-strategy-versions';
import { useChartStore } from '@/stores/chart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { StrategyEditor } from '@/components/strategy/strategy-editor';
import { BacktestResultsSummary } from './backtest-results-summary';
import { BacktestTradeList } from './backtest-trade-list';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { GetUserStrategyVersionDto } from '@/types/strategy';

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

export function BacktestTab() {
  const { strategies } = useStrategies();
  const {
    selectedStrategyNo,
    setSelectedStrategyNo,
    currentRun,
    currentTrades,
    isRunning,
    run,
  } = useBacktest();
  const {
    versions,
    selectedVersionNo,
    setSelectedVersionNo,
    loadVersions,
  } = useStrategyVersions();

  const { symbol, timeframe } = useChartStore();

  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [initialCapital, setInitialCapital] = useState('10000000');
  const [editOpen, setEditOpen] = useState(false);

  // Load versions when strategy changes
  useEffect(() => {
    if (selectedStrategyNo) {
      loadVersions(selectedStrategyNo);
      setSelectedVersionNo(null);
    }
  }, [selectedStrategyNo, loadVersions, setSelectedVersionNo]);

  const handleStrategyChange = (value: string) => {
    const no = Number(value);
    setSelectedStrategyNo(no);
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
    } catch {
      // error handled in store
    }
  };

  // Sort versions newest first
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

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {/* Strategy dropdown */}
        <div>
          <Label className="text-xs text-[#787b86]">Strategy</Label>
          <Select
            value={selectedStrategyNo?.toString() ?? ''}
            onValueChange={handleStrategyChange}
          >
            <SelectTrigger className="w-full h-8 text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
              <SelectValue placeholder="Select strategy..." />
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
        </div>

        {/* Version dropdown */}
        {selectedStrategyNo && (
          <div>
            <Label className="text-xs text-[#787b86]">Version</Label>
            <Select
              value={selectedVersionNo?.toString() ?? 'latest'}
              onValueChange={handleVersionChange}
            >
              <SelectTrigger className="w-full h-8 text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
                <SelectValue placeholder="Select version..." />
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
          </div>
        )}

        {/* Backtest params */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-[#787b86]">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]"
              />
            </div>
            <div>
              <Label className="text-xs text-[#787b86]">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#787b86]">Initial Capital</Label>
            <Input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              className="h-8 text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={isRunning || !selectedStrategyNo}
            className="w-full h-9 text-sm bg-[#2962ff] hover:bg-[#2962ff]/80 text-white"
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running...
              </span>
            ) : (
              'Run Backtest'
            )}
          </Button>
        </div>

        {/* Strategy edit toggle section */}
        {selectedStrategyNo && (
          <div className="border border-[#2a2e39] rounded overflow-hidden">
            <button
              onClick={() => setEditOpen(!editOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#d1d4dc] hover:bg-[#1e222d] transition-colors"
            >
              {editOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#787b86]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#787b86]" />
              )}
              Strategy Edit
            </button>
            {editOpen && (
              <div className="border-t border-[#2a2e39] p-3">
                <StrategyEditor
                  strategyNo={selectedStrategyNo}
                  onChanged={() => {
                    loadVersions(selectedStrategyNo);
                  }}
                  hideSettings
                />
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {currentRun && currentRun.status === 'COMPLETED' && (
          <>
            <BacktestResultsSummary run={currentRun} />
            <BacktestTradeList trades={currentTrades} />
          </>
        )}

        {currentRun && currentRun.status === 'FAILED' && (
          <div className="p-3 rounded border border-[#ef5350]/30 bg-[#ef5350]/5">
            <p className="text-xs text-[#ef5350]">
              Backtest failed: {currentRun.errorMessage || 'Unknown error'}
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
