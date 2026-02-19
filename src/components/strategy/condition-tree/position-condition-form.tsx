'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PositionCondition, PositionField, ComparisonOperator } from '@/types/strategy';
import { POSITION_FIELDS, POSITION_FIELD_LABELS, COMPARISON_OPERATORS, COMPARISON_OPERATOR_LABELS } from '@/types/strategy';

interface PositionConditionFormProps {
  condition: PositionCondition;
  onChange: (updated: PositionCondition) => void;
}

/** POSITION 조건에서 사용 가능한 연산자 (BETWEEN 제외) */
const POSITION_OPERATORS = COMPARISON_OPERATORS.filter(
  (op) => op !== 'BETWEEN',
);

const FIELD_PLACEHOLDER: Record<PositionField, string> = {
  changePercent: '-5',
  trailingPercent: '-3',
  highChangePercent: '5',
  holdingMinutes: '120',
};

const FIELD_UNIT: Record<PositionField, string> = {
  changePercent: '%',
  trailingPercent: '%',
  highChangePercent: '%',
  holdingMinutes: '분',
};

export function PositionConditionForm({ condition, onChange }: PositionConditionFormProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Select value={condition.field} onValueChange={(v) => onChange({ ...condition, field: v as PositionField })}>
        <SelectTrigger className="w-32 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]">
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {POSITION_FIELDS.map((f) => (
            <SelectItem key={f} value={f} className="text-[#d1d4dc] text-xs">
              {POSITION_FIELD_LABELS[f]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={condition.operator} onValueChange={(v) => onChange({ ...condition, operator: v as ComparisonOperator })}>
        <SelectTrigger className="w-16 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
          {POSITION_OPERATORS.map((op) => (
            <SelectItem key={op} value={op} className="text-[#d1d4dc] text-xs">
              {COMPARISON_OPERATOR_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="number"
        step="any"
        value={typeof condition.value === 'number' ? condition.value : ''}
        onChange={(e) => onChange({ ...condition, value: parseFloat(e.target.value) || 0 })}
        placeholder={FIELD_PLACEHOLDER[condition.field]}
        className="w-20 h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
      />

      <span className="text-[10px] text-[#787b86]">{FIELD_UNIT[condition.field]}</span>
    </div>
  );
}
