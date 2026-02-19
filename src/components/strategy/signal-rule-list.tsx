'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SignalRuleEditor } from './signal-rule-editor';
import { useConditionIndicators } from '@/hooks/use-condition-indicators';
import { STRATEGY_LIMITS } from '@/types/strategy';
import type {
  GetUserSignalRuleDto,
  GetUserIndicatorConfigDto,
  CreateRuleRequest,
  UpdateRuleRequest,
  ConditionGroup,
  LeafCondition,
} from '@/types/strategy';

interface SignalRuleListProps {
  rules: GetUserSignalRuleDto[];
  onAdd: (body: CreateRuleRequest) => Promise<unknown>;
  onUpdate: (ruleNo: number, body: UpdateRuleRequest) => Promise<unknown>;
  onDelete: (ruleNo: number) => Promise<void>;
}

const TYPE_COLORS: Record<string, string> = {
  BUY: 'bg-[#26a69a]/20 text-[#26a69a] border-[#26a69a]/30',
  SELL: 'bg-[#ef5350]/20 text-[#ef5350] border-[#ef5350]/30',
};

function collectLeafConditions(tree: ConditionGroup): LeafCondition[] {
  const leaves: LeafCondition[] = [];
  if (!tree?.conditions) return leaves;
  for (const c of tree.conditions) {
    if ('logic' in c && 'conditions' in c && !('type' in c)) {
      leaves.push(...collectLeafConditions(c as ConditionGroup));
    } else {
      leaves.push(c as LeafCondition);
    }
  }
  return leaves;
}

function summarizeLeafConditions(
  tree: ConditionGroup,
  indicators: GetUserIndicatorConfigDto[],
): string {
  const leaves = collectLeafConditions(tree);
  if (leaves.length === 0) return '(empty)';

  const parts: string[] = [];
  for (const leaf of leaves) {
    if (leaf.type === 'POSITION') {
      const op = leaf.operator === 'GT' ? '>' : leaf.operator === 'LT' ? '<' : leaf.operator === 'GTE' ? '>=' : leaf.operator === 'LTE' ? '<=' : leaf.operator === 'EQ' ? '=' : leaf.operator;
      const val = typeof leaf.value === 'number' ? leaf.value : `${leaf.value[0]}~${leaf.value[1]}`;
      parts.push(`${leaf.field} ${op} ${val}`);
      continue;
    }

    const ind = indicators.find(
      (i) => Number(i.userIndicatorConfigNo) === Number(leaf.indicatorRef),
    );
    const indName = ind?.displayName ?? ind?.indicatorType ?? '?';

    if (leaf.type === 'THRESHOLD') {
      const op = leaf.operator === 'GT' ? '>' : leaf.operator === 'LT' ? '<' : leaf.operator === 'GTE' ? '>=' : leaf.operator === 'LTE' ? '<=' : leaf.operator === 'EQ' ? '=' : leaf.operator;
      const val = Array.isArray(leaf.value) ? `${leaf.value[0]}~${leaf.value[1]}` : leaf.value;
      parts.push(`${indName} ${op} ${val}`);
    } else if (leaf.type === 'CROSS') {
      const target = indicators.find(
        (i) => Number(i.userIndicatorConfigNo) === Number(leaf.targetRef),
      );
      const targetName = target?.displayName ?? target?.indicatorType ?? '?';
      parts.push(`${indName} ${leaf.operator} ${targetName}`);
    } else if (leaf.type === 'PRICE') {
      parts.push(`${indName} ${leaf.operator} ${leaf.priceField}`);
    }
  }

  const summary = parts.join(', ');
  return summary.length > 60 ? summary.slice(0, 57) + '...' : summary;
}

export function SignalRuleList({ rules, onAdd, onUpdate, onDelete }: SignalRuleListProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<GetUserSignalRuleDto | null>(null);
  const [deletingNo, setDeletingNo] = useState<number | null>(null);
  const indicators = useConditionIndicators();

  const buyRules = rules.filter((r) => r.ruleType === 'BUY');
  const sellRules = rules.filter((r) => r.ruleType === 'SELL');

  function handleAdd() { setEditing(null); setEditorOpen(true); }
  function handleEdit(rule: GetUserSignalRuleDto) { setEditing(rule); setEditorOpen(true); }

  async function handleDelete(ruleNo: number) {
    setDeletingNo(ruleNo);
    try { await onDelete(ruleNo); } finally { setDeletingNo(null); }
  }

  function renderRuleGroup(type: string, groupRules: GetUserSignalRuleDto[]) {
    const atLimit = groupRules.length >= STRATEGY_LIMITS.maxRulesPerType;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#787b86] uppercase tracking-wider">
            {type} Rules ({groupRules.length}/{STRATEGY_LIMITS.maxRulesPerType})
          </h3>
          <Button size="sm" variant="ghost" onClick={handleAdd} disabled={atLimit} className="h-6 px-2 text-[10px] text-[#787b86] hover:text-[#d1d4dc]">
            <Plus className="h-3.5 w-3.5 mr-0.5" /> Add
          </Button>
        </div>
        {groupRules.length === 0 ? (
          <p className="text-xs text-[#787b86] italic py-2">No {type.toLowerCase()} rules</p>
        ) : (
          <div className="space-y-1.5">
            {groupRules.sort((a, b) => a.priority - b.priority).map((rule) => (
              <div key={rule.userSignalRuleNo} className="px-3 py-2 rounded-md bg-[#0a0e17] border border-[#2a2e39]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[rule.ruleType] ?? ''}`}>{rule.ruleType}</Badge>
                    <span className="text-xs font-mono text-[#787b86]">P{rule.priority}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon-xs" variant="ghost" onClick={() => handleEdit(rule)} className="text-[#787b86] hover:text-[#d1d4dc]"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon-xs" variant="ghost" onClick={() => handleDelete(rule.userSignalRuleNo)} disabled={deletingNo === rule.userSignalRuleNo} className="text-[#787b86] hover:text-[#ef5350]"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <p className="text-[10px] text-[#787b86] mt-1 truncate">
                  {summarizeLeafConditions(rule.conditions, indicators)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderRuleGroup('BUY', buyRules)}
      {renderRuleGroup('SELL', sellRules)}
      <SignalRuleEditor open={editorOpen} onOpenChange={setEditorOpen} editingRule={editing} onCreate={onAdd} onUpdate={onUpdate} />
    </div>
  );
}
