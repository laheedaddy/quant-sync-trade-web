import { apiClient } from './client';
import type {
  WatchlistGroup,
  CreateWatchlistGroupRequest,
  UpdateWatchlistGroupRequest,
  AddWatchlistItemRequest,
  MoveWatchlistItemRequest,
  WatchlistItem,
} from '@/types/watchlist';

const BASE = '/v1/watchlist';

export async function fetchWatchlistGroups(): Promise<WatchlistGroup[]> {
  return apiClient<WatchlistGroup[]>(`${BASE}/group`);
}

export async function createWatchlistGroup(
  body: CreateWatchlistGroupRequest,
): Promise<WatchlistGroup> {
  return apiClient<WatchlistGroup>(`${BASE}/group`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateWatchlistGroup(
  groupNo: number,
  body: UpdateWatchlistGroupRequest,
): Promise<WatchlistGroup> {
  return apiClient<WatchlistGroup>(`${BASE}/group/${groupNo}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteWatchlistGroup(groupNo: number): Promise<void> {
  await apiClient<void>(`${BASE}/group/${groupNo}`, { method: 'DELETE' });
}

export async function addWatchlistItem(
  groupNo: number,
  body: AddWatchlistItemRequest,
): Promise<WatchlistItem> {
  return apiClient<WatchlistItem>(`${BASE}/group/${groupNo}/item`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function moveWatchlistItem(
  itemNo: number,
  body: MoveWatchlistItemRequest,
): Promise<void> {
  await apiClient<void>(`${BASE}/item/${itemNo}/move`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function removeWatchlistItem(itemNo: number): Promise<void> {
  await apiClient<void>(`${BASE}/item/${itemNo}`, { method: 'DELETE' });
}
