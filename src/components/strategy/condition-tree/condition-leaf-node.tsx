'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThresholdConditionForm } from './threshold-condition-form';
import { CrossConditionForm } from './cross-condition-form';
import { PriceConditionForm } from './price-condition-form';
import { PositionConditionForm } from './position-condition-form';
import type { LeafCondition } from '@/types/strategy';

interface ConditionLeafNodeProps {
  condition: LeafCondition;
  onChange: (updated: LeafCondition) => void;
  onDelete: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  THRESHOLD: 'bg-[#26a69a]/20 text-[#26a69a] border-[#26a69a]/30',
  CROSS: 'bg-[#ab47bc]/20 text-[#ab47bc] border-[#ab47bc]/30',
  PRICE: 'bg-[#ff9800]/20 text-[#ff9800] border-[#ff9800]/30',
  POSITION: 'bg-[#ef5350]/20 text-[#ef5350] border-[#ef5350]/30',
};

const TYPE_LABELS: Record<string, string> = {
  THRESHOLD: 'THRESHOLD',
  CROSS: 'CROSS',
  PRICE: 'PRICE',
  POSITION: 'SL/TP',
};

export function ConditionLeafNode({ condition, onChange, onDelete }: ConditionLeafNodeProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded bg-[#0a0e17]/50">
      <Badge
        variant="outline"
        className={`text-[10px] shrink-0 ${TYPE_COLORS[condition.type] ?? ''}`}
      >
        {TYPE_LABELS[condition.type] ?? condition.type}
      </Badge>

      <div className="flex-1 min-w-0">
        {condition.type === 'THRESHOLD' && (
          <ThresholdConditionForm condition={condition} onChange={(c) => onChange(c)} />
        )}
        {condition.type === 'CROSS' && (
          <CrossConditionForm condition={condition} onChange={(c) => onChange(c)} />
        )}
        {condition.type === 'PRICE' && (
          <PriceConditionForm condition={condition} onChange={(c) => onChange(c)} />
        )}
        {condition.type === 'POSITION' && (
          <PositionConditionForm condition={condition} onChange={(c) => onChange(c)} />
        )}
      </div>

      <Button
        size="icon-xs"
        variant="ghost"
        onClick={onDelete}
        className="text-[#787b86] hover:text-[#ef5350] shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
