'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ThresholdCondition } from '@/types/strategy';
import { COMPARISON_OPERATORS, COMPARISON_OPERATOR_LABELS } from '@/types/strategy';
import { useConditionIndicators } from '@/hooks/use-condition-indicators';
import { useChartStore } from '@/stores/chart-store';
import { getIndicatorFields, getDefaultField } from '@/lib/strategy/indicator-fields';
import type { IndicatorType } from '@/types/strategy';

interface ThresholdConditionFormProps {
  condition: ThresholdCondition;
  onChange: (updated: ThresholdCondition) => void;
}

export function ThresholdConditionForm({ condition, onChange }: ThresholdConditionFormProps) {
  const indicators = useConditionIndicators();
  const priceScaleMode = useChartStore((s) => s.priceScaleMode);
  const selected = indicators.find((i) => Number(i.userIndicatorConfigNo) === Number(condition.indicatorRef));
  const fields = selected ? getIndicatorFields(selected.indicatorType as IndicatorType) : [];
  const isDrawingChannel = selected?.indicatorType === 'DRAWING_CHANNEL';

  function handleIndicatorChange(v: string) {
    const no = parseInt(v);
    const ind = indicators.find((i) => Number(i.userIndicatorConfigNo) === no);
    onChange({
      ...condition,
      indicatorRef: no,
      field: ind ? getDefaultField(ind.indicatorType as IndicatorType) : '',
    });
  }

  const isBetween = condition.operator === 'BETWEEN';
  const value = condition.value;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Select value={condition.indicatorRef?.toString() ?? ''} onValueChange={handleIndicatorChange}>
        <SelectTrigger className="w-28 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]">
          <SelectValue placeholder="Indicator" />
        </SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {indicators.map((i) => (
            <SelectItem key={i.userIndicatorConfigNo} value={i.userIndicatorConfigNo.toString()} className="text-[#d1d4dc] text-xs">
              {i.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isDrawingChannel && (
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${priceScaleMode === 1 ? 'border-[#ff9800]/50 text-[#ff9800] bg-[#ff9800]/10' : 'border-[#787b86]/40 text-[#787b86] bg-[#787b86]/10'}`}>
          {priceScaleMode === 1 ? 'Log' : 'Linear'}
        </span>
      )}

      <Select value={condition.field || undefined} onValueChange={(v) => onChange({ ...condition, field: v })} disabled={fields.length === 0}>
        <SelectTrigger className="w-20 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc] disabled:opacity-40">
          <SelectValue placeholder={fields.length === 0 ? '—' : 'Field'} />
        </SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {fields.map((f) => (<SelectItem key={f.key} value={f.key} className="text-[#d1d4dc] text-xs">{f.label}</SelectItem>))}
        </SelectContent>
      </Select>

      <Select value={condition.operator} onValueChange={(v) => onChange({ ...condition, operator: v as ThresholdCondition['operator'] })}>
        <SelectTrigger className="w-20 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {COMPARISON_OPERATORS.map((op) => (<SelectItem key={op} value={op} className="text-[#d1d4dc] text-xs">{COMPARISON_OPERATOR_LABELS[op]}</SelectItem>))}
        </SelectContent>
      </Select>

      {isBetween ? (
        <>
          <Input type="number" value={Array.isArray(value) ? value[0] : ''} onChange={(e) => onChange({ ...condition, value: [parseFloat(e.target.value) || 0, Array.isArray(value) ? value[1] : 0] })} placeholder="min" className="w-16 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]" />
          <span className="text-xs text-[#787b86]">~</span>
          <Input type="number" value={Array.isArray(value) ? value[1] : ''} onChange={(e) => onChange({ ...condition, value: [Array.isArray(value) ? value[0] : 0, parseFloat(e.target.value) || 0] })} placeholder="max" className="w-16 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]" />
        </>
      ) : (
        <Input type="number" value={typeof value === 'number' ? value : ''} onChange={(e) => onChange({ ...condition, value: parseFloat(e.target.value) || 0 })} placeholder="value" className="w-20 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]" />
      )}
    </div>
  );
}
