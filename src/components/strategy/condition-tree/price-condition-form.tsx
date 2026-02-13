'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PriceCondition, PriceField, IndicatorType } from '@/types/strategy';
import { COMPARISON_OPERATORS, COMPARISON_OPERATOR_LABELS, PRICE_FIELDS, PRICE_FIELD_LABELS } from '@/types/strategy';
import { useStrategyDetailStore } from '@/stores/strategy-detail-store';
import { getIndicatorFields, getDefaultField } from '@/lib/strategy/indicator-fields';

interface PriceConditionFormProps {
  condition: PriceCondition;
  onChange: (updated: PriceCondition) => void;
}

export function PriceConditionForm({ condition, onChange }: PriceConditionFormProps) {
  const indicators = useStrategyDetailStore((s) => s.indicators);
  const selected = indicators.find((i) => i.userIndicatorConfigNo === condition.indicatorRef);
  const fields = selected ? getIndicatorFields(selected.indicatorType as IndicatorType) : [];

  function handleIndicatorChange(v: string) {
    const no = parseInt(v);
    const ind = indicators.find((i) => i.userIndicatorConfigNo === no);
    onChange({ ...condition, indicatorRef: no, field: ind ? getDefaultField(ind.indicatorType as IndicatorType) : '' });
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Select value={condition.indicatorRef?.toString() ?? ''} onValueChange={handleIndicatorChange}>
        <SelectTrigger className="w-28 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue placeholder="Indicator" /></SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {indicators.map((i) => (<SelectItem key={i.userIndicatorConfigNo} value={i.userIndicatorConfigNo.toString()} className="text-[#d1d4dc] text-xs">{i.displayName}</SelectItem>))}
        </SelectContent>
      </Select>

      <Select value={condition.field || undefined} onValueChange={(v) => onChange({ ...condition, field: v })} disabled={fields.length === 0}>
        <SelectTrigger className="w-20 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc] disabled:opacity-40"><SelectValue placeholder={fields.length === 0 ? '—' : 'Field'} /></SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {fields.map((f) => (<SelectItem key={f.key} value={f.key} className="text-[#d1d4dc] text-xs">{f.label}</SelectItem>))}
        </SelectContent>
      </Select>

      <Select value={condition.operator} onValueChange={(v) => onChange({ ...condition, operator: v as PriceCondition['operator'] })}>
        <SelectTrigger className="w-20 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {COMPARISON_OPERATORS.filter((op) => op !== 'BETWEEN').map((op) => (<SelectItem key={op} value={op} className="text-[#d1d4dc] text-xs">{COMPARISON_OPERATOR_LABELS[op]}</SelectItem>))}
        </SelectContent>
      </Select>

      <Select value={condition.priceField} onValueChange={(v) => onChange({ ...condition, priceField: v as PriceField })}>
        <SelectTrigger className="w-20 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {PRICE_FIELDS.map((pf) => (<SelectItem key={pf} value={pf} className="text-[#d1d4dc] text-xs">{PRICE_FIELD_LABELS[pf]}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>
  );
}
