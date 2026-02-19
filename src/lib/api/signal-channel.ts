import { apiClient } from './client';
import type {
  SignalChannel,
  SignalChannelLog,
  ChannelStatus,
  ChannelMonitor,
  CreateSignalChannelRequest,
} from '@/types/signal-channel';

const base = (strategyNo: number) => `/v1/strategy/${strategyNo}/channel`;

export async function createChannel(
  strategyNo: number,
  body: CreateSignalChannelRequest,
): Promise<SignalChannel> {
  return apiClient<SignalChannel>(base(strategyNo), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchChannels(strategyNo: number): Promise<SignalChannel[]> {
  return apiClient<SignalChannel[]>(base(strategyNo));
}

export async function fetchChannel(
  strategyNo: number,
  channelNo: number,
): Promise<SignalChannel> {
  return apiClient<SignalChannel>(`${base(strategyNo)}/${channelNo}`);
}

export async function connectChannel(
  strategyNo: number,
  channelNo: number,
): Promise<SignalChannel> {
  return apiClient<SignalChannel>(`${base(strategyNo)}/${channelNo}/connect`, {
    method: 'PUT',
  });
}

export async function disconnectChannel(
  strategyNo: number,
  channelNo: number,
): Promise<SignalChannel> {
  return apiClient<SignalChannel>(`${base(strategyNo)}/${channelNo}/disconnect`, {
    method: 'PUT',
  });
}

export async function startReceiving(
  strategyNo: number,
  channelNo: number,
): Promise<SignalChannel> {
  return apiClient<SignalChannel>(`${base(strategyNo)}/${channelNo}/start-receiving`, {
    method: 'PUT',
  });
}

export async function stopReceiving(
  strategyNo: number,
  channelNo: number,
): Promise<SignalChannel> {
  return apiClient<SignalChannel>(`${base(strategyNo)}/${channelNo}/stop-receiving`, {
    method: 'PUT',
  });
}

export async function deleteChannel(
  strategyNo: number,
  channelNo: number,
): Promise<void> {
  await apiClient<void>(`${base(strategyNo)}/${channelNo}`, { method: 'DELETE' });
}

export async function fetchChannelStatus(
  strategyNo: number,
  channelNo: number,
): Promise<ChannelStatus> {
  return apiClient<ChannelStatus>(`${base(strategyNo)}/${channelNo}/status`);
}

export async function fetchChannelMonitor(
  strategyNo: number,
  channelNo: number,
  currentPrice?: number,
): Promise<ChannelMonitor> {
  const query = currentPrice != null ? `?currentPrice=${currentPrice}` : '';
  return apiClient<ChannelMonitor>(`${base(strategyNo)}/${channelNo}/monitor${query}`);
}

export async function fetchChannelLogs(
  strategyNo: number,
  channelNo: number,
  page?: number,
  limit?: number,
): Promise<SignalChannelLog[]> {
  const params = new URLSearchParams();
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient<SignalChannelLog[]>(`${base(strategyNo)}/${channelNo}/logs${query}`);
}
