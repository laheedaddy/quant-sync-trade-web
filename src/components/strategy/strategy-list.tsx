'use client';

import { useState } from 'react';
import { useStrategies } from '@/hooks/use-strategies';
import { StrategyCard } from './strategy-card';
import { CreateStrategyDialog } from './create-strategy-dialog';
import { DeleteStrategyDialog } from './delete-strategy-dialog';
import { STRATEGY_LIMITS } from '@/types/strategy';
import type { GetUserStrategyDto } from '@/types/strategy';
import { Skeleton } from '@/components/ui/skeleton';

export function StrategyList() {
  const { strategies, isLoading, error, create, remove, toggleActive } = useStrategies();
  const [deleteTarget, setDeleteTarget] = useState<GetUserStrategyDto | null>(null);

  const atLimit = strategies.length >= STRATEGY_LIMITS.maxStrategies;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#ef5350]">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#d1d4dc]">Strategies</h2>
          <span className="text-xs font-mono text-[#787b86]">
            {strategies.length}/{STRATEGY_LIMITS.maxStrategies}
          </span>
        </div>
        <CreateStrategyDialog onCreate={create} disabled={atLimit} />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 bg-[#1e222d]" />
          ))}
        </div>
      ) : strategies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-sm text-[#787b86]">No strategies yet.</p>
          <p className="text-xs text-[#787b86] mt-1">
            Create your first strategy to start defining trading signals.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {strategies.map((s) => (
            <StrategyCard
              key={s.userStrategyNo}
              strategy={s}
              onToggleActive={toggleActive}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <DeleteStrategyDialog
        strategy={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={remove}
      />
    </div>
  );
}
