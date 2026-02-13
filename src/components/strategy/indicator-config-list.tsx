'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndicatorConfigDialog } from './indicator-config-dialog';
import { STRATEGY_LIMITS } from '@/types/strategy';
import type { GetUserIndicatorConfigDto, IndicatorType, CreateIndicatorRequest, UpdateIndicatorRequest } from '@/types/strategy';
import { getIndicatorLabel } from '@/lib/strategy/indicator-fields';

interface IndicatorConfigListProps {
  indicators: GetUserIndicatorConfigDto[];
  onAdd: (body: CreateIndicatorRequest) => Promise<unknown>;
  onEdit: (indicatorConfigNo: number, body: UpdateIndicatorRequest) => Promise<unknown>;
  onDelete: (indicatorConfigNo: number) => Promise<void>;
}

export function IndicatorConfigList({ indicators, onAdd, onEdit, onDelete }: IndicatorConfigListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GetUserIndicatorConfigDto | null>(null);
  const [deletingNo, setDeletingNo] = useState<number | null>(null);

  const atLimit = indicators.length >= STRATEGY_LIMITS.maxIndicators;

  function handleAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleEdit(ind: GetUserIndicatorConfigDto) {
    setEditing(ind);
    setDialogOpen(true);
  }

  async function handleSubmit(type: IndicatorType, displayName: string, params: Record<string, number>) {
    if (editing) {
      await onEdit(editing.userIndicatorConfigNo, { displayName, parameters: params });
    } else {
      await onAdd({ indicatorType: type, displayName, parameters: params });
    }
  }

  async function handleDelete(indicatorConfigNo: number) {
    setDeletingNo(indicatorConfigNo);
    try {
      await onDelete(indicatorConfigNo);
    } finally {
      setDeletingNo(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[#787b86]">
          {indicators.length}/{STRATEGY_LIMITS.maxIndicators}
        </span>
        <Button size="sm" variant="ghost" onClick={handleAdd} disabled={atLimit} className="text-[#787b86] hover:text-[#d1d4dc]">
          <Plus className="h-4 w-4 mr-1" /> Add Indicator
        </Button>
      </div>

      {indicators.length === 0 ? (
        <p className="text-sm text-[#787b86] text-center py-8">
          No indicators configured. Add indicators to use in signal rules.
        </p>
      ) : (
        <div className="space-y-2">
          {indicators.map((ind) => (
            <div key={ind.userIndicatorConfigNo} className="flex items-center justify-between px-3 py-2 rounded-md bg-[#0a0e17] border border-[#2a2e39]">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[#d1d4dc] border-[#2a2e39] font-mono text-xs">
                  {ind.indicatorType}
                </Badge>
                <span className="text-sm text-[#787b86] font-mono">
                  {getIndicatorLabel(ind.indicatorType as IndicatorType, ind.parameters)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon-xs" variant="ghost" onClick={() => handleEdit(ind)} className="text-[#787b86] hover:text-[#d1d4dc]">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon-xs" variant="ghost" onClick={() => handleDelete(ind.userIndicatorConfigNo)} disabled={deletingNo === ind.userIndicatorConfigNo} className="text-[#787b86] hover:text-[#ef5350]">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <IndicatorConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingIndicator={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
