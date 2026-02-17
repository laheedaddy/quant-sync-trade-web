'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBacktestStore } from '@/stores/backtest-store';
import { StrategySelectTab } from './strategy-select-tab';
import { ChannelsTab } from '@/components/signal-channel/channels-tab';

export function StrategyListPanel() {
  const { listTab, setListTab } = useBacktestStore();

  return (
    <Tabs
      value={listTab}
      onValueChange={(v) => setListTab(v as 'strategy' | 'channels')}
      className="flex flex-col h-full"
    >
      <TabsList className="grid grid-cols-2 mx-2 mt-2 bg-[#1e222d]">
        <TabsTrigger
          value="strategy"
          className="text-xs data-[state=active]:bg-[#2962ff] data-[state=active]:text-white"
        >
          Strategy
        </TabsTrigger>
        <TabsTrigger
          value="channels"
          className="text-xs data-[state=active]:bg-[#2962ff] data-[state=active]:text-white"
        >
          Channels
        </TabsTrigger>
      </TabsList>

      <TabsContent value="strategy" className="flex-1 min-h-0 overflow-auto mt-0">
        <StrategySelectTab />
      </TabsContent>

      <TabsContent value="channels" className="flex-1 min-h-0 overflow-auto mt-0">
        <ChannelsTab />
      </TabsContent>
    </Tabs>
  );
}
