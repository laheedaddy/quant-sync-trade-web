'use client';

import { Plus, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConditionLeafNode } from './condition-leaf-node';
import type { ConditionGroup, Condition, LeafCondition, GroupOperator, ConditionType } from '@/types/strategy';
import { isConditionGroup, STRATEGY_LIMITS, CONDITION_TYPES } from '@/types/strategy';
import { createDefaultGroup, createDefaultLeaf } from '@/lib/strategy/condition-helpers';

interface ConditionGroupNodeProps {
  group: ConditionGroup;
  depth: number;
  onChange: (updated: ConditionGroup) => void;
  onDelete?: () => void;
}

const DEPTH_BG = ['bg-[#131722]', 'bg-[#161b27]', 'bg-[#1a1f2e]'];
const LOGIC_BORDER: Record<GroupOperator, string> = { AND: 'border-l-[#2196F3]', OR: 'border-l-[#FFD54F]' };
const LOGIC_COLOR: Record<GroupOperator, string> = { AND: 'text-[#2196F3]', OR: 'text-[#FFD54F]' };

export function ConditionGroupNode({ group, depth, onChange, onDelete }: ConditionGroupNodeProps) {
  const bg = DEPTH_BG[Math.min(depth - 1, DEPTH_BG.length - 1)];
  const canNest = depth < STRATEGY_LIMITS.maxDepth;

  function handleLogicChange(v: string) { onChange({ ...group, logic: v as GroupOperator }); }

  function handleAddCondition(type: ConditionType) {
    onChange({ ...group, conditions: [...group.conditions, createDefaultLeaf(type)] });
  }

  function handleAddGroup() {
    if (!canNest) return;
    onChange({ ...group, conditions: [...group.conditions, createDefaultGroup()] });
  }

  function handleChildChange(index: number, updated: Condition) {
    const newConditions = [...group.conditions];
    newConditions[index] = updated;
    onChange({ ...group, conditions: newConditions });
  }

  function handleChildDelete(index: number) {
    onChange({ ...group, conditions: group.conditions.filter((_, i) => i !== index) });
  }

  return (
    <div className={`${bg} border-l-2 ${LOGIC_BORDER[group.logic]} rounded-r-md p-2 space-y-2`}>
      <div className="flex items-center gap-2">
        <Select value={group.logic} onValueChange={handleLogicChange}>
          <SelectTrigger className={`w-16 h-7 text-xs font-semibold bg-transparent border-[#2a2e39] ${LOGIC_COLOR[group.logic]}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
            <SelectItem value="AND" className="text-[#2196F3] text-xs font-semibold">AND</SelectItem>
            <SelectItem value="OR" className="text-[#FFD54F] text-xs font-semibold">OR</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-xs" variant="ghost" className="text-[#787b86] hover:text-[#d1d4dc]"><Plus className="h-3.5 w-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1e222d] border-[#2a2e39]">
            {CONDITION_TYPES.map((ct) => (
              <DropdownMenuItem key={ct} onClick={() => handleAddCondition(ct)} className="text-[#d1d4dc] text-xs">
                {ct}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {canNest ? (
          <Button size="icon-xs" variant="ghost" onClick={handleAddGroup} className="text-[#787b86] hover:text-[#d1d4dc]">
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span><Button size="icon-xs" variant="ghost" disabled className="text-[#787b86]"><FolderPlus className="h-3.5 w-3.5" /></Button></span>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1e222d] text-[#d1d4dc] border-[#2a2e39]">Max depth ({STRATEGY_LIMITS.maxDepth}) reached</TooltipContent>
          </Tooltip>
        )}

        {onDelete && (
          <Button size="icon-xs" variant="ghost" onClick={onDelete} className="text-[#787b86] hover:text-[#ef5350] ml-auto">
            <span className="text-xs">x</span>
          </Button>
        )}
      </div>

      {group.conditions.length === 0 && (
        <p className="text-xs text-[#787b86] px-2 py-1 italic">Empty group — add a condition or nested group</p>
      )}

      <div className="space-y-1.5">
        {group.conditions.map((child, i) =>
          isConditionGroup(child) ? (
            <ConditionGroupNode key={i} group={child} depth={depth + 1} onChange={(u) => handleChildChange(i, u)} onDelete={() => handleChildDelete(i)} />
          ) : (
            <ConditionLeafNode key={i} condition={child as LeafCondition} onChange={(u) => handleChildChange(i, u)} onDelete={() => handleChildDelete(i)} />
          ),
        )}
      </div>
    </div>
  );
}
