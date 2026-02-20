'use client';

import { StrategySelectTab } from './strategy-select-tab';

export function StrategyListPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-[#2a2e39] flex-shrink-0">
        <h3 className="text-xs font-medium text-[#787b86] uppercase tracking-wider">
          Strategy
        </h3>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <StrategySelectTab />
      </div>
    </div>
  );
}
