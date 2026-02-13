'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ConditionGroupNode } from './condition-group-node';
import type { ConditionGroup } from '@/types/strategy';

interface ConditionTreeBuilderProps {
  value: ConditionGroup;
  onChange: (updated: ConditionGroup) => void;
}

export function ConditionTreeBuilder({ value, onChange }: ConditionTreeBuilderProps) {
  return (
    <TooltipProvider>
      <div className="space-y-1">
        <ConditionGroupNode
          group={value}
          depth={1}
          onChange={onChange}
        />
      </div>
    </TooltipProvider>
  );
}
