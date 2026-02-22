'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CrossCondition, IndicatorType } from '@/types/strategy';
import { CROSS_OPERATORS, CROSS_OPERATOR_LABELS, INDICATOR_INDEX_OPTIONS } from '@/types/strategy';
import { useConditionIndicators } from '@/hooks/use-condition-indicators';
import { useChartStore } from '@/stores/chart-store';
import { getIndicatorFields, getDefaultField } from '@/lib/strategy/indicator-fields';

interface CrossConditionFormProps {
  condition: CrossCondition;
  onChange: (updated: CrossCondition) => void;
}

export function CrossConditionForm({ condition, onChange }: CrossConditionFormProps) {
  const indicators = useConditionIndicators();
  const priceScaleMode = useChartStore((s) => s.priceScaleMode);
  const sourceInd = indicators.find((i) => Number(i.userIndicatorConfigNo) === Number(condition.indicatorRef));
  const targetInd = indicators.find((i) => Number(i.userIndicatorConfigNo) === Number(condition.targetRef));
  const sourceFields = sourceInd ? getIndicatorFields(sourceInd.indicatorType as IndicatorType) : [];
  const targetFields = targetInd ? getIndicatorFields(targetInd.indicatorType as IndicatorType) : [];
  const hasDrawingChannel = sourceInd?.indicatorType === 'DRAWING_CHANNEL' || targetInd?.indicatorType === 'DRAWING_CHANNEL';

  function handleSourceChange(v: string) {
    const no = parseInt(v);
    const ind = indicators.find((i) => Number(i.userIndicatorConfigNo) === no);
    onChange({ ...condition, indicatorRef: no, field: ind ? getDefaultField(ind.indicatorType as IndicatorType) : '' });
  }

  function handleTargetChange(v: string) {
    const no = parseInt(v);
    const ind = indicators.find((i) => Number(i.userIndicatorConfigNo) === no);
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

      <div className="flex items-center gap-0.5">
        <Input
          type="number"
          step="0.1"
          value={condition.offsetPercent ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ ...condition, offsetPercent: v === '' ? undefined : parseFloat(v) });
          }}
          placeholder="±%"
          className="w-14 h-7 text-xs text-center bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
        />
        <span className="text-[10px] text-[#787b86]">%</span>
      </div>

      <Select value={(condition.index ?? 0).toString()} onValueChange={(v) => onChange({ ...condition, index: parseInt(v) })}>
        <SelectTrigger className="w-20 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {INDICATOR_INDEX_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value.toString()} className="text-[#d1d4dc] text-xs">{opt.label}</SelectItem>))}
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

      <div className="flex items-center gap-0.5">
        <Input
          type="number"
          step="0.1"
          value={condition.targetOffsetPercent ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ ...condition, targetOffsetPercent: v === '' ? undefined : parseFloat(v) });
          }}
          placeholder="±%"
          className="w-14 h-7 text-xs text-center bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
        />
        <span className="text-[10px] text-[#787b86]">%</span>
      </div>

      <Select value={(condition.targetIndex ?? 0).toString()} onValueChange={(v) => onChange({ ...condition, targetIndex: parseInt(v) })}>
        <SelectTrigger className="w-20 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {INDICATOR_INDEX_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value.toString()} className="text-[#d1d4dc] text-xs">{opt.label}</SelectItem>))}
        </SelectContent>
      </Select>

      {hasDrawingChannel && (
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${priceScaleMode === 1 ? 'border-[#ff9800]/50 text-[#ff9800] bg-[#ff9800]/10' : 'border-[#787b86]/40 text-[#787b86] bg-[#787b86]/10'}`}>
          {priceScaleMode === 1 ? 'Log' : 'Linear'}
        </span>
      )}
    </div>
  );
}
