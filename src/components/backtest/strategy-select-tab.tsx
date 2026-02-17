'use client';

import { useState, useCallback, useEffect } from 'react';
import { useBacktest } from '@/hooks/use-backtest';
import { useStrategies } from '@/hooks/use-strategies';
import { fetchVersions } from '@/lib/api/strategy-version';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateStrategyDialog } from '@/components/strategy/create-strategy-dialog';
import { DeleteStrategyDialog } from '@/components/strategy/delete-strategy-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit3,
  MoreVertical,
  Pause,
  Play,
  Trash2,
} from 'lucide-react';
import { showInfo } from '@/lib/toast';
import { useChartStore } from '@/stores/chart-store';
import { STRATEGY_LIMITS } from '@/types/strategy';
import type { GetUserStrategyDto, GetUserStrategyVersionDto } from '@/types/strategy';

// ─── Main Component ───

export function StrategySelectTab() {
  const { selectedStrategyNo, setSelectedStrategyNo, setDetailStrategyNo, setDetailTab } = useBacktest();
  const { strategies, isLoading, create, remove, toggleActive } = useStrategies();
  const { symbol: chartSymbol, timeframe: chartTimeframe, activeStrategyNo, setActiveStrategyNo } = useChartStore();

  const [deleteTarget, setDeleteTarget] = useState<GetUserStrategyDto | null>(null);

  const atLimit = strategies.length >= STRATEGY_LIMITS.maxStrategies;

  // Edit button → detail view (edit tab) + apply to chart
  const handleEditClick = (strategy: GetUserStrategyDto) => {
    setSelectedStrategyNo(strategy.userStrategyNo);
    setDetailStrategyNo(strategy.userStrategyNo);
    setDetailTab('edit');
    setActiveStrategyNo(strategy.userStrategyNo);
    showInfo(`전략 차트로 전환: ${strategy.name}`);
  };

  // Card click → detail view (overview tab) + apply to chart
  const handleCardClick = (strategy: GetUserStrategyDto) => {
    setSelectedStrategyNo(strategy.userStrategyNo);
    setDetailStrategyNo(strategy.userStrategyNo);
    setDetailTab('backtest');
    setActiveStrategyNo(strategy.userStrategyNo);
    showInfo(`전략 차트로 전환: ${strategy.name}`);
  };

  const contextLabel = chartSymbol ? `${chartSymbol} / ${chartTimeframe}` : '';

  // Wrap create to auto-navigate to detail after creation
  const handleCreate = useCallback(async (body: { name: string; description?: string }) => {
    const created = await create(body);
    if (created && created.userStrategyNo) {
      setSelectedStrategyNo(created.userStrategyNo);
      setDetailStrategyNo(created.userStrategyNo);
      setDetailTab('edit');
      setActiveStrategyNo(created.userStrategyNo);
    }
    return created;
  }, [create, setSelectedStrategyNo, setDetailStrategyNo, setDetailTab, setActiveStrategyNo]);

  return (
    <div className="p-2 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <h3 className="text-xs font-medium text-[#d1d4dc]">
          전략 목록
          {chartSymbol && (
            <span className="text-[10px] text-[#787b86] ml-1.5 font-normal">
              {contextLabel}
            </span>
          )}
        </h3>
        <CreateStrategyDialog onCreate={handleCreate} disabled={atLimit} contextLabel={contextLabel} />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-[#1e222d]" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && strategies.length === 0 && (
        <div className="p-4 text-center">
          <p className="text-sm text-[#787b86]">전략이 없습니다.</p>
          <p className="text-[10px] text-[#787b86] mt-1">
            New Strategy 버튼으로 생성하세요.
          </p>
        </div>
      )}

      {/* Strategy cards */}
      {!isLoading &&
        strategies.map((s) => (
          <StrategyCard
            key={s.userStrategyNo}
            strategy={s}
            isAppliedToChart={activeStrategyNo === s.userStrategyNo}
            onCardClick={() => handleCardClick(s)}
            onEdit={() => handleEditClick(s)}
            onToggleActive={() => toggleActive(s.userStrategyNo, s.isActive)}
            onDelete={() => setDeleteTarget(s)}
          />
        ))}

      <DeleteStrategyDialog
        strategy={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={remove}
      />
    </div>
  );
}

// ─── Strategy Card (simplified, no version tree) ───

interface StrategyCardProps {
  strategy: GetUserStrategyDto;
  isAppliedToChart: boolean;
  onCardClick: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

function StrategyCard({ strategy, isAppliedToChart, onCardClick, onEdit, onToggleActive, onDelete }: StrategyCardProps) {
  const [majorCount, setMajorCount] = useState<number | null>(null);
  const [minorCount, setMinorCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchVersions(strategy.userStrategyNo).then((list) => {
      if (cancelled) return;
      setMajorCount(list.filter((v) => v.versionType === 'MAJOR').length);
      setMinorCount(list.filter((v) => v.versionType === 'MINOR').length);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [strategy.userStrategyNo]);

  return (
    <div
      className={`rounded border overflow-hidden transition-colors ${
        isAppliedToChart
          ? 'border-l-2 border-l-[#2962ff] border-[#2962ff]/40 bg-[#1e222d]'
          : strategy.isActive
            ? 'border-[#2a2e39] bg-[#1e222d]'
            : 'border-[#2a2e39]/50 bg-[#1e222d]/50 opacity-60'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-1.5 p-2.5">
        <button
          onClick={onCardClick}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-medium text-[#d1d4dc] truncate">
              {strategy.name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {majorCount !== null && (
                <Badge
                  variant="outline"
                  className="text-[9px] h-4 border-[#ff9800]/40 text-[#ff9800]"
                >
                  {majorCount}v {minorCount}d
                </Badge>
              )}
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
            <span className="text-[10px] text-[#787b86] line-clamp-1">
              {strategy.description}
            </span>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 text-[#787b86] hover:text-[#d1d4dc] transition-colors shrink-0">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1e222d] border-[#2a2e39]">
            <DropdownMenuItem onClick={onEdit} className="text-[#d1d4dc] text-xs">
              <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive} className="text-[#d1d4dc] text-xs">
              {strategy.isActive ? (
                <><Pause className="mr-2 h-3.5 w-3.5" /> Deactivate</>
              ) : (
                <><Play className="mr-2 h-3.5 w-3.5" /> Activate</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#2a2e39]" />
            <DropdownMenuItem onClick={onDelete} className="text-[#ef5350] focus:text-[#ef5350] text-xs">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
