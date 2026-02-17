'use client';

import { useState, useCallback } from 'react';
import {
  fetchStocks,
  createStock,
  updateStock,
  deleteStock,
  syncStocksFromFmp,
  syncCryptoFromBinance,
  fetchCollectionTargets,
  createCollectionTarget,
  updateCollectionTarget,
  deleteCollectionTarget,
  backfillCollectionTarget,
} from '@/lib/api/management';
import type {
  Stock,
  CreateStockRequest,
  CollectionTarget,
  CreateCollectionTargetRequest,
  BackfillRequest,
} from '@/types/management';
import { showError, showSuccess } from '@/lib/toast';

// ──────────────────────────────────────────────
// useStockManagement
// ──────────────────────────────────────────────

export function useStockManagement() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async (exchange?: string) => {
    setIsLoading(true);
    try {
      const list = await fetchStocks(exchange);
      setStocks(list);
    } catch (err) {
      showError(err, '종목 목록 조회 실패');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (body: CreateStockRequest) => {
    try {
      const created = await createStock(body);
      setStocks((prev) => [...prev, created]);
      showSuccess('종목이 등록되었습니다.');
      return created;
    } catch (err) {
      showError(err, '종목 등록 실패');
      throw err;
    }
  }, []);

  const toggle = useCallback(async (stockNo: number, currentlyActive: boolean) => {
    try {
      const updated = await updateStock(stockNo, { isActive: !currentlyActive });
      setStocks((prev) =>
        prev.map((s) => (s.stockNo === stockNo ? updated : s)),
      );
      showSuccess(updated.isActive ? '종목이 활성화되었습니다.' : '종목이 비활성화되었습니다.');
    } catch (err) {
      showError(err, '종목 수정 실패');
      throw err;
    }
  }, []);

  const remove = useCallback(async (stockNo: number) => {
    try {
      await deleteStock(stockNo);
      setStocks((prev) => prev.filter((s) => s.stockNo !== stockNo));
      showSuccess('종목이 삭제되었습니다.');
    } catch (err) {
      showError(err, '종목 삭제 실패');
      throw err;
    }
  }, []);

  const syncFmp = useCallback(async (exchange?: string) => {
    try {
      const count = await syncStocksFromFmp(exchange);
      showSuccess(`FMP 동기화 완료: ${count}건`);
      return count;
    } catch (err) {
      showError(err, 'FMP 동기화 실패');
      throw err;
    }
  }, []);

  const syncBinance = useCallback(async () => {
    try {
      const count = await syncCryptoFromBinance('USDT');
      showSuccess(`Binance 동기화 완료: ${count}건`);
      return count;
    } catch (err) {
      showError(err, 'Binance 동기화 실패');
      throw err;
    }
  }, []);

  return { stocks, isLoading, load, create, toggle, remove, syncFmp, syncBinance };
}

// ──────────────────────────────────────────────
// useCollectionTargetManagement
// ──────────────────────────────────────────────

export function useCollectionTargetManagement() {
  const [targets, setTargets] = useState<CollectionTarget[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchCollectionTargets();
      setTargets(list);
    } catch (err) {
      showError(err, '수집 대상 목록 조회 실패');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (body: CreateCollectionTargetRequest) => {
    try {
      const created = await createCollectionTarget(body);
      setTargets((prev) => [...prev, created]);
      showSuccess('수집 대상이 등록되었습니다.');
      return created;
    } catch (err) {
      showError(err, '수집 대상 등록 실패');
      throw err;
    }
  }, []);

  const toggle = useCallback(async (collectionTargetNo: number, currentlyActive: boolean) => {
    try {
      const updated = await updateCollectionTarget(collectionTargetNo, { isActive: !currentlyActive });
      setTargets((prev) =>
        prev.map((t) => (t.collectionTargetNo === collectionTargetNo ? updated : t)),
      );
      showSuccess(updated.isActive ? '수집이 활성화되었습니다.' : '수집이 비활성화되었습니다.');
    } catch (err) {
      showError(err, '수집 대상 수정 실패');
      throw err;
    }
  }, []);

  const remove = useCallback(async (collectionTargetNo: number) => {
    try {
      await deleteCollectionTarget(collectionTargetNo);
      setTargets((prev) => prev.filter((t) => t.collectionTargetNo !== collectionTargetNo));
      showSuccess('수집 대상이 삭제되었습니다.');
    } catch (err) {
      showError(err, '수집 대상 삭제 실패');
      throw err;
    }
  }, []);

  const backfill = useCallback(async (collectionTargetNo: number, body: BackfillRequest) => {
    try {
      const result = await backfillCollectionTarget(collectionTargetNo, body);
      showSuccess(`Backfill 완료: ${result.collected}건 수집 (${result.from} ~ ${result.to})`);
      return result;
    } catch (err) {
      showError(err, 'Backfill 실패');
      throw err;
    }
  }, []);

  return { targets, isLoading, load, create, toggle, remove, backfill };
}
