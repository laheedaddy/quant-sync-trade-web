'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStrategies } from '@/hooks/use-strategies';
import { useSignalChannels } from '@/hooks/use-signal-channels';
import { useBacktestStore } from '@/stores/backtest-store';
import { getChannelState } from '@/types/signal-channel';
import type { SignalChannel } from '@/types/signal-channel';
import { CreateChannelDialog } from './create-channel-dialog';
import { ChannelDetailView } from './channel-detail-view';

// ─── Channel Card (compact, clickable) ───

export function ChannelCard({
  channel,
  onClick,
}: {
  channel: SignalChannel;
  onClick: () => void;
}) {
  const state = getChannelState(channel);

  const stateStyle = {
    RECEIVING: { cls: 'bg-[#26a69a]/20 text-[#26a69a] border-[#26a69a]/30', dot: 'bg-[#26a69a]', pulse: true },
    CONNECTED: { cls: 'bg-[#2962ff]/20 text-[#2962ff] border-[#2962ff]/30', dot: 'bg-[#2962ff]', pulse: false },
    DISCONNECTED: { cls: 'text-[#787b86] border-[#2a2e39]', dot: 'bg-[#787b86]', pulse: false },
  }[state];

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded border border-[#2a2e39] p-2.5 bg-[#1e222d] hover:border-[#363a45] transition-colors"
    >
      {/* Row 1: symbol + state badge */}
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-sm font-medium text-[#d1d4dc] truncate">
          {channel.symbol}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-[10px] text-[#787b86]">v{channel.versionNumber ?? '?'}</span>
          <Badge className={`${stateStyle.cls} text-[9px] h-4`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${stateStyle.dot} mr-1 ${stateStyle.pulse ? 'animate-pulse' : ''}`} />
            {state}
          </Badge>
        </div>
      </div>

      {/* Row 2: timeframe + last signal */}
      <div className="flex items-center justify-between text-[10px] text-[#787b86]">
        <span>{channel.timeframe}</span>
        {channel.lastSignalType ? (
          <span>
            Last{' '}
            <span className={channel.lastSignalType === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
              {channel.lastSignalType}
            </span>
            {channel.lastSignalPrice != null && (
              <span className="ml-1 text-[#d1d4dc]">
                ${Number(channel.lastSignalPrice).toLocaleString()}
              </span>
            )}
          </span>
        ) : (
          <span className="italic">No signals</span>
        )}
      </div>
    </button>
  );
}

// ─── Channels Tab ───

export function ChannelsTab() {
  const { strategies } = useStrategies();
  const { selectedStrategyNo } = useBacktestStore();

  const strategyNo = selectedStrategyNo ?? strategies[0]?.userStrategyNo;
  const strategy = strategies.find((s) => s.userStrategyNo === strategyNo);

  const {
    channels,
    isLoadingChannels,
    reload,
  } = useSignalChannels(strategyNo);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<SignalChannel | null>(null);

  if (!strategyNo) {
    return (
      <div className="p-4 text-center text-[#787b86] text-sm">
        Select a strategy to manage signal channels.
      </div>
    );
  }

  // ── Detail View ──
  if (selectedChannel) {
    return (
      <ChannelDetailView
        strategyNo={strategyNo}
        channel={selectedChannel}
        onBack={() => setSelectedChannel(null)}
      />
    );
  }

  // ── List View ──
  return (
    <div className="p-2 space-y-2">
      <div className="flex items-center justify-end px-1">
        <Button
          size="sm"
          className="h-6 text-[10px] px-2 bg-[#2962ff] hover:bg-[#1e53e5] text-white"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-3 h-3 mr-1" />
          New Channel
        </Button>
      </div>

      {isLoadingChannels ? (
        <div className="space-y-1.5">
          <Skeleton className="h-14 bg-[#1e222d]" />
          <Skeleton className="h-14 bg-[#1e222d]" />
        </div>
      ) : channels.length === 0 ? (
        <div className="p-8 text-center text-[#787b86] text-sm">
          No channels yet. Create one to start receiving signals.
        </div>
      ) : (
        <div className="space-y-1.5">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.signalChannelNo}
              channel={channel}
              onClick={() => setSelectedChannel(channel)}
            />
          ))}
        </div>
      )}

      <CreateChannelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        strategyNo={strategyNo}
        symbol={strategy?.symbol ?? ''}
        timeframe={strategy?.timeframe ?? '1day'}
        onCreated={reload}
      />
    </div>
  );
}
