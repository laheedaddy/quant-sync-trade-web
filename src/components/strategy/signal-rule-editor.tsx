'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConditionTreeBuilder } from './condition-tree/condition-tree-builder';
import { createDefaultGroup, validateConditionTree } from '@/lib/strategy/condition-helpers';
import { SIGNAL_RULE_TYPES } from '@/types/strategy';
import type { GetUserSignalRuleDto, SignalRuleType, ConditionGroup, CreateRuleRequest, UpdateRuleRequest } from '@/types/strategy';

interface SignalRuleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule?: GetUserSignalRuleDto | null;
  onCreate: (body: CreateRuleRequest) => Promise<unknown>;
  onUpdate: (ruleNo: number, body: UpdateRuleRequest) => Promise<unknown>;
}

export function SignalRuleEditor({ open, onOpenChange, editingRule, onCreate, onUpdate }: SignalRuleEditorProps) {
  const isEditing = !!editingRule;
  const [ruleType, setRuleType] = useState<SignalRuleType>('BUY');
  const [priority, setPriority] = useState(0);
  const [conditionTree, setConditionTree] = useState<ConditionGroup>(createDefaultGroup());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (editingRule) {
      setRuleType(editingRule.ruleType);
      setPriority(editingRule.priority);
      setConditionTree(editingRule.conditions ?? createDefaultGroup());
    } else {
      setRuleType('BUY');
      setPriority(0);
      setConditionTree(createDefaultGroup());
    }
    setErrors([]);
  }, [editingRule, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateConditionTree(conditionTree);
    if (validationErrors.length > 0) { setErrors(validationErrors); return; }

    setLoading(true);
    try {
      if (isEditing) {
        await onUpdate(editingRule.userSignalRuleNo, { priority, conditions: conditionTree });
      } else {
        await onCreate({ ruleType, priority, conditions: conditionTree });
      }
      onOpenChange(false);
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc] sm:max-w-2xl max-h-[85vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogHeader><DialogTitle>{isEditing ? 'Edit Rule' : 'Add Rule'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={ruleType} onValueChange={(v) => setRuleType(v as SignalRuleType)} disabled={isEditing}>
                  <SelectTrigger className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                    {SIGNAL_RULE_TYPES.map((t) => (<SelectItem key={t} value={t} className="text-[#d1d4dc]">{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Input type="number" value={priority} onChange={(e) => setPriority(parseInt(e.target.value) || 0)} min={0} max={100} className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]" />
              </div>
            </div>
            <div className="grid gap-2 flex-1 min-h-0">
              <Label>Condition Tree</Label>
              <p className="text-[10px] text-[#787b86] -mt-1">PRICE 조건의 O/H/L/C는 백테스트에서만 구분되며, 실시간 시그널에서는 항상 현재 체결가와 비교됩니다.</p>
              <ScrollArea className="flex-1 min-h-[200px] max-h-[400px]">
                <ConditionTreeBuilder value={conditionTree} onChange={setConditionTree} />
              </ScrollArea>
            </div>
            {errors.length > 0 && (
              <div className="text-xs text-[#ef5350] space-y-1">
                {errors.map((err, i) => (<p key={i}>{err}</p>))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-[#787b86]">Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[#2962ff] hover:bg-[#1e53e5] text-white">
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
