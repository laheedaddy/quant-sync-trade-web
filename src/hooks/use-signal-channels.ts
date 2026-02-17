'use client';

import { useEffect, useCallback } from 'react';
import { useSignalChannelStore } from '@/stores/signal-channel-store';
import {
  fetchChannels,
  createChannel,
  connectChannel,
  disconnectChannel,
  startReceiving,
  stopReceiving,
  deleteChannel,
  fetchChannelLogs,
} from '@/lib/api/signal-channel';
import type { CreateSignalChannelRequest } from '@/types/signal-channel';
import { showError, showSuccess } from '@/lib/toast';

export function useSignalChannels(strategyNo?: number) {
  const store = useSignalChannelStore();

  const load = useCallback(async () => {
    if (!strategyNo) return;
    store.setIsLoadingChannels(true);
    try {
      const list = await fetchChannels(strategyNo);
      store.setChannels(list);
    } catch (err) {
      showError(err);
    } finally {
      store.setIsLoadingChannels(false);
    }
  }, [strategyNo]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (body: CreateSignalChannelRequest) => {
      if (!strategyNo) return;
      try {
        const created = await createChannel(strategyNo, body);
        store.addChannel(created);
        showSuccess('시그널 채널이 생성되었습니다.');
        return created;
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo],
  );

  const connect = useCallback(
    async (channelNo: number) => {
      if (!strategyNo) return;
      try {
        const updated = await connectChannel(strategyNo, channelNo);
        store.updateChannel(channelNo, updated);
        showSuccess('채널이 연결되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo],
  );

  const disconnect = useCallback(
    async (channelNo: number) => {
      if (!strategyNo) return;
      try {
        const updated = await disconnectChannel(strategyNo, channelNo);
        store.updateChannel(channelNo, updated);
        showSuccess('채널 연결이 해제되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo],
  );

  const startRecv = useCallback(
    async (channelNo: number) => {
      if (!strategyNo) return;
      try {
        const updated = await startReceiving(strategyNo, channelNo);
        store.updateChannel(channelNo, updated);
        showSuccess('시그널 수신이 시작되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo],
  );

  const stopRecv = useCallback(
    async (channelNo: number) => {
      if (!strategyNo) return;
      try {
        const updated = await stopReceiving(strategyNo, channelNo);
        store.updateChannel(channelNo, updated);
        showSuccess('시그널 수신이 중지되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo],
  );

  const remove = useCallback(
    async (channelNo: number) => {
      if (!strategyNo) return;
      try {
        await deleteChannel(strategyNo, channelNo);
        store.removeChannel(channelNo);
        showSuccess('채널이 삭제되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [strategyNo],
  );

  const loadLogs = useCallback(
    async (channelNo: number, page?: number, limit?: number) => {
      if (!strategyNo) return;
      store.setIsLoadingLogs(true);
      try {
        const logs = await fetchChannelLogs(strategyNo, channelNo, page, limit);
        store.setChannelLogs(logs);
      } catch (err) {
        showError(err);
      } finally {
        store.setIsLoadingLogs(false);
      }
    },
    [strategyNo],
  );

  return {
    channels: store.channels,
    selectedChannelNo: store.selectedChannelNo,
    channelLogs: store.channelLogs,
    isLoadingChannels: store.isLoadingChannels,
    isLoadingLogs: store.isLoadingLogs,
    setSelectedChannelNo: store.setSelectedChannelNo,
    create,
    connect,
    disconnect,
    startReceiving: startRecv,
    stopReceiving: stopRecv,
    remove,
    loadLogs,
    reload: load,
  };
}
