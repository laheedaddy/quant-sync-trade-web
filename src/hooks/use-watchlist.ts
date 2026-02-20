'use client';

import { useCallback, useEffect } from 'react';
import { useWatchlistStore } from '@/stores/watchlist-store';
import {
  fetchWatchlistGroups,
  createWatchlistGroup as apiCreateGroup,
  updateWatchlistGroup as apiUpdateGroup,
  deleteWatchlistGroup as apiDeleteGroup,
  addWatchlistItem as apiAddItem,
  moveWatchlistItem as apiMoveItem,
  removeWatchlistItem as apiRemoveItem,
} from '@/lib/api/watchlist';
import { showError, showSuccess } from '@/lib/toast';
import type {
  CreateWatchlistGroupRequest,
  UpdateWatchlistGroupRequest,
  AddWatchlistItemRequest,
} from '@/types/watchlist';

export function useWatchlist() {
  const store = useWatchlistStore();

  // Load groups on mount
  useEffect(() => {
    let cancelled = false;
    store.setIsLoading(true);
    fetchWatchlistGroups()
      .then((groups) => {
        if (!cancelled) store.setGroups(groups);
      })
      .catch(() => {
        // API may not exist yet — silently fail
        if (!cancelled) store.setGroups([]);
      })
      .finally(() => {
        if (!cancelled) store.setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createGroup = useCallback(async (body: CreateWatchlistGroupRequest) => {
    try {
      const group = await apiCreateGroup(body);
      store.addGroup({ ...group, items: group.items ?? [] });
      showSuccess('그룹이 생성되었습니다.');
      return group;
    } catch (err) {
      showError(err, '그룹 생성 실패');
      throw err;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateGroup = useCallback(async (groupNo: number, body: UpdateWatchlistGroupRequest) => {
    try {
      const updated = await apiUpdateGroup(groupNo, body);
      store.updateGroup(groupNo, updated);
      showSuccess('그룹이 수정되었습니다.');
    } catch (err) {
      showError(err, '그룹 수정 실패');
      throw err;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteGroup = useCallback(async (groupNo: number) => {
    // Optimistic
    const prev = store.groups;
    store.removeGroup(groupNo);
    try {
      await apiDeleteGroup(groupNo);
      showSuccess('그룹이 삭제되었습니다.');
    } catch (err) {
      store.setGroups(prev);
      showError(err, '그룹 삭제 실패');
      throw err;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = useCallback(async (groupNo: number, body: AddWatchlistItemRequest) => {
    try {
      const item = await apiAddItem(groupNo, body);
      store.addItem(groupNo, item);
      showSuccess(`${body.symbol} 종목이 추가되었습니다.`);
      return item;
    } catch (err) {
      showError(err, '종목 추가 실패');
      throw err;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const moveItem = useCallback(async (fromGroupNo: number, toGroupNo: number, itemNo: number) => {
    // Optimistic
    const prevGroups = store.groups;
    store.moveItem(fromGroupNo, toGroupNo, itemNo);
    try {
      await apiMoveItem(itemNo, { targetGroupNo: toGroupNo });
    } catch (err) {
      store.setGroups(prevGroups);
      showError(err, '종목 이동 실패');
      throw err;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const removeItem = useCallback(async (groupNo: number, itemNo: number) => {
    // Optimistic
    const prevGroups = store.groups;
    store.removeItem(groupNo, itemNo);
    try {
      await apiRemoveItem(itemNo);
    } catch (err) {
      store.setGroups(prevGroups);
      showError(err, '종목 삭제 실패');
      throw err;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    groups: store.groups,
    isLoading: store.isLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    addItem,
    moveItem,
    removeItem,
  };
}
