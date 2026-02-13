'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CrossCondition, IndicatorType } from '@/types/strategy';
import { CROSS_OPERATORS, CROSS_OPERATOR_LABELS } from '@/types/strategy';
import { useStrategyDetailStore } from '@/stores/strategy-detail-store';
import { getIndicatorFields, getDefaultField } from '@/lib/strategy/indicator-fields';

interface CrossConditionFormProps {
  condition: CrossCondition;
  onChange: (updated: CrossCondition) => void;
}

export function CrossConditionForm({ condition, onChange }: CrossConditionFormProps) {
  const indicators = useStrategyDetailStore((s) => s.indicators);
  const sourceInd = indicators.find((i) => i.userIndicatorConfigNo === condition.indicatorRef);
  const targetInd = indicators.find((i) => i.userIndicatorConfigNo === condition.targetRef);
  const sourceFields = sourceInd ? getIndicatorFields(sourceInd.indicatorType as IndicatorType) : [];
  const targetFields = targetInd ? getIndicatorFields(targetInd.indicatorType as IndicatorType) : [];

  function handleSourceChange(v: string) {
    const no = parseInt(v);
    const ind = indicators.find((i) => i.userIndicatorConfigNo === no);
    onChange({ ...condition, indicatorRef: no, field: ind ? getDefaultField(ind.indicatorType as IndicatorType) : '' });
  }

  function handleTargetChange(v: string) {
    const no = parseInt(v);
    const ind = indicators.find((i) => i.userIndicatorConfigNo === no);
    onChange({ ...condition, targetRef: no, targetField: ind ? getDefaultField(ind.indicatorType as IndicatorType) : null });
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Select value={condition.indicatorRef?.toString() ?? ''} onValueChange={handleSourceChange}>
        <SelectTrigger className="w-28 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue placeholder="Source" /></SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {indicators.map((i) => (<SelectItem key={i.userIndicatorConfigNo} value={i.userIndicatorConfigNo.toString()} className="text-[#d1d4dc] text-xs">{i.displayName}</SelectItem>))}
        </SelectContent>
      </Select>

      <Select value={condition.field || undefined} onValueChange={(v) => onChange({ ...condition, field: v })} disabled={sourceFields.length === 0}>
        <SelectTrigger className="w-20 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc] disabled:opacity-40"><SelectValue placeholder={sourceFields.length === 0 ? '—' : 'Field'} /></SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {sourceFields.map((f) => (<SelectItem key={f.key} value={f.key} className="text-[#d1d4dc] text-xs">{f.label}</SelectItem>))}
        </SelectContent>
      </Select>

      <Select value={condition.operator} onValueChange={(v) => onChange({ ...condition, operator: v as CrossCondition['operator'] })}>
        <SelectTrigger className="w-28 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {CROSS_OPERATORS.map((op) => (<SelectItem key={op} value={op} className="text-[#d1d4dc] text-xs">{CROSS_OPERATOR_LABELS[op]}</SelectItem>))}
        </SelectContent>
      </Select>

      <Select value={condition.targetRef?.toString() ?? ''} onValueChange={handleTargetChange}>
        <SelectTrigger className="w-28 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue placeholder="Target" /></SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {indicators.map((i) => (<SelectItem key={i.userIndicatorConfigNo} value={i.userIndicatorConfigNo.toString()} className="text-[#d1d4dc] text-xs">{i.displayName}</SelectItem>))}
        </SelectContent>
      </Select>

      <Select value={condition.targetField ?? undefined} onValueChange={(v) => onChange({ ...condition, targetField: v })} disabled={targetFields.length === 0}>
        <SelectTrigger className="w-20 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc] disabled:opacity-40"><SelectValue placeholder={targetFields.length === 0 ? '—' : 'Field'} /></SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {targetFields.map((f) => (<SelectItem key={f.key} value={f.key} className="text-[#d1d4dc] text-xs">{f.label}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>
  );
}
