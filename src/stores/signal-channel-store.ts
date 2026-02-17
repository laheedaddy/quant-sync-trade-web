import { create } from 'zustand';
import type { SignalChannel, SignalChannelLog } from '@/types/signal-channel';

interface SignalChannelState {
  channels: SignalChannel[];
  selectedChannelNo: number | null;
  channelLogs: SignalChannelLog[];
  isLoadingChannels: boolean;
  isLoadingLogs: boolean;

  setChannels: (channels: SignalChannel[]) => void;
  addChannel: (channel: SignalChannel) => void;
  updateChannel: (channelNo: number, partial: Partial<SignalChannel>) => void;
  removeChannel: (channelNo: number) => void;
  setSelectedChannelNo: (no: number | null) => void;
  setChannelLogs: (logs: SignalChannelLog[]) => void;
  setIsLoadingChannels: (loading: boolean) => void;
  setIsLoadingLogs: (loading: boolean) => void;
}

export const useSignalChannelStore = create<SignalChannelState>((set) => ({
  channels: [],
  selectedChannelNo: null,
  channelLogs: [],
  isLoadingChannels: false,
  isLoadingLogs: false,

  setChannels: (channels) => set({ channels }),
  addChannel: (channel) =>
    set((state) => ({ channels: [channel, ...state.channels] })),
  updateChannel: (channelNo, partial) =>
    set((state) => ({
      channels: state.channels.map((ch) =>
        ch.signalChannelNo === channelNo ? { ...ch, ...partial } : ch,
      ),
    })),
  removeChannel: (channelNo) =>
    set((state) => ({
      channels: state.channels.filter((ch) => ch.signalChannelNo !== channelNo),
    })),
  setSelectedChannelNo: (selectedChannelNo) => set({ selectedChannelNo }),
  setChannelLogs: (channelLogs) => set({ channelLogs }),
  setIsLoadingChannels: (isLoadingChannels) => set({ isLoadingChannels }),
  setIsLoadingLogs: (isLoadingLogs) => set({ isLoadingLogs }),
}));
