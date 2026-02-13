'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SignalRuleEditor } from './signal-rule-editor';
import { STRATEGY_LIMITS } from '@/types/strategy';
import type { GetUserSignalRuleDto, CreateRuleRequest, UpdateRuleRequest } from '@/types/strategy';

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

export function SignalRuleList({ rules, onAdd, onUpdate, onDelete }: SignalRuleListProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<GetUserSignalRuleDto | null>(null);
  const [deletingNo, setDeletingNo] = useState<number | null>(null);

  const buyRules = rules.filter((r) => r.ruleType === 'BUY');
  const sellRules = rules.filter((r) => r.ruleType === 'SELL');
  const allAtLimit = buyRules.length >= STRATEGY_LIMITS.maxRulesPerType && sellRules.length >= STRATEGY_LIMITS.maxRulesPerType;

  function handleAdd() { setEditing(null); setEditorOpen(true); }
  function handleEdit(rule: GetUserSignalRuleDto) { setEditing(rule); setEditorOpen(true); }

  async function handleDelete(ruleNo: number) {
    setDeletingNo(ruleNo);
    try { await onDelete(ruleNo); } finally { setDeletingNo(null); }
  }

  function countConditions(tree: { conditions?: unknown[] }): number {
    if (!tree?.conditions) return 0;
    let count = 0;
    for (const c of tree.conditions) {
      if ((c as { conditions?: unknown[] }).conditions) {
        count += countConditions(c as { conditions: unknown[] });
      } else { count += 1; }
    }
    return count;
  }

  function renderRuleGroup(type: string, groupRules: GetUserSignalRuleDto[]) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[#787b86] uppercase tracking-wider">
          {type} Rules ({groupRules.length}/{STRATEGY_LIMITS.maxRulesPerType})
        </h3>
        {groupRules.length === 0 ? (
          <p className="text-xs text-[#787b86] italic py-2">No {type.toLowerCase()} rules</p>
        ) : (
          <div className="space-y-1.5">
            {groupRules.sort((a, b) => a.priority - b.priority).map((rule) => (
              <div key={rule.userSignalRuleNo} className="flex items-center justify-between px-3 py-2 rounded-md bg-[#0a0e17] border border-[#2a2e39]">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[rule.ruleType] ?? ''}`}>{rule.ruleType}</Badge>
                  <span className="text-xs font-mono text-[#787b86]">P{rule.priority}</span>
                  <span className="text-xs text-[#787b86]">{countConditions(rule.conditions)} conditions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon-xs" variant="ghost" onClick={() => handleEdit(rule)} className="text-[#787b86] hover:text-[#d1d4dc]"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon-xs" variant="ghost" onClick={() => handleDelete(rule.userSignalRuleNo)} disabled={deletingNo === rule.userSignalRuleNo} className="text-[#787b86] hover:text-[#ef5350]"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" variant="ghost" onClick={handleAdd} disabled={allAtLimit} className="text-[#787b86] hover:text-[#d1d4dc]">
          <Plus className="h-4 w-4 mr-1" /> Add Rule
        </Button>
      </div>
      {renderRuleGroup('BUY', buyRules)}
      {renderRuleGroup('SELL', sellRules)}
      <SignalRuleEditor open={editorOpen} onOpenChange={setEditorOpen} editingRule={editing} onCreate={onAdd} onUpdate={onUpdate} />
    </div>
  );
}
