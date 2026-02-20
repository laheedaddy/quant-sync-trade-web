'use client';

import { useBacktestStore } from '@/stores/backtest-store';
import { useStrategies } from '@/hooks/use-strategies';
import { ChannelsTab } from './channels-tab';

export function ChannelsPanelContent() {
  const { strategies } = useStrategies();
  const { selectedStrategyNo } = useBacktestStore();

  const strategyNo = selectedStrategyNo ?? strategies[0]?.userStrategyNo;

  if (!strategyNo) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 border-b border-[#2a2e39] flex-shrink-0">
          <h3 className="text-xs font-medium text-[#787b86] uppercase tracking-wider">
            Signal Channels
          </h3>
        </div>
        <div className="p-4 text-center text-[#787b86] text-sm">
          Select a strategy to manage signal channels.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-[#2a2e39] flex-shrink-0">
        <h3 className="text-xs font-medium text-[#787b86] uppercase tracking-wider">
          Signal Channels
        </h3>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <ChannelsTab />
      </div>
    </div>
  );
}
