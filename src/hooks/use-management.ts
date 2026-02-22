'use client';

import { useState, useCallback } from 'react';
import {
  fetchStocks,
  updateStock,
  deleteStock,
  restoreStock,
  backfillStock,
  bulkRegisterStocks,
  enrichProfiles,
  enrichStock,
} from '@/lib/api/management';
import type {
  Stock,
  StockQuery,
  BackfillRequest,
  BulkRegisterItem,
} from '@/types/management';
import { showError, showSuccess } from '@/lib/toast';

// ──────────────────────────────────────────────
// useStockManagement
// ──────────────────────────────────────────────

export function useStockManagement() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async (query?: StockQuery) => {
    setIsLoading(true);
    try {
      const { items, totalCount: count } = await fetchStocks(query);
      setStocks(items);
      setTotalCount(count);
    } catch (err) {
      showError(err, '종목 목록 조회 실패');
    } finally {
      setIsLoading(false);
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

  const toggleCollection = useCallback(async (stockNo: number, currentlyActive: boolean) => {
    try {
      const updated = await updateStock(stockNo, { isCollectionActive: !currentlyActive });
      setStocks((prev) =>
        prev.map((s) => (s.stockNo === stockNo ? updated : s)),
      );
      showSuccess(updated.isCollectionActive ? '수집이 활성화되었습니다.' : '수집이 비활성화되었습니다.');
    } catch (err) {
      showError(err, '수집 상태 변경 실패');
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

  const restore = useCallback(async (stockNo: number) => {
    try {
      const updated = await restoreStock(stockNo);
      setStocks((prev) =>
        prev.map((s) => (s.stockNo === stockNo ? updated : s)),
      );
      showSuccess('종목이 복원되었습니다.');
      return updated;
    } catch (err) {
      showError(err, '종목 복원 실패');
      throw err;
    }
  }, []);

  const backfill = useCallback(async (stockNo: number, body: BackfillRequest) => {
    try {
      const result = await backfillStock(stockNo, body);
      showSuccess(`Backfill 완료: ${result.totalCollected}건 수집 (${result.from} ~ ${result.to}, ${Object.keys(result.timeframeResults).length}개 타임프레임)`);
      return result;
    } catch (err) {
      showError(err, 'Backfill 실패');
      throw err;
    }
  }, []);

  const bulkRegister = useCallback(async (items: BulkRegisterItem[]) => {
    try {
      const count = await bulkRegisterStocks(items);
      showSuccess(`${count}개 종목이 등록되었습니다.`);
      return count;
    } catch (err) {
      showError(err, '벌크 등록 실패');
      throw err;
    }
  }, []);

  const enrichAll = useCallback(async () => {
    let totalEnriched = 0;
    let totalReconciled = 0;
    let batch = 0;
    // 반복 호출: 대상이 남아있는 동안 계속
    while (true) {
      batch++;
      const { enriched, reconciled } = await enrichProfiles(100);
      totalEnriched += enriched;
      totalReconciled += reconciled;
      if (enriched === 0 && reconciled === 0) break;
      showSuccess(`Enrich batch #${batch}: ${enriched}건 보충, ${reconciled}건 병합`);
    }
    return { totalEnriched, totalReconciled };
  }, []);

  const editMeta = useCallback(async (stockNo: number, body: { stockNameLocal?: string | null; tags?: string | null }) => {
    try {
      const updated = await updateStock(stockNo, body);
      setStocks((prev) =>
        prev.map((s) => (s.stockNo === stockNo ? updated : s)),
      );
      showSuccess('종목 메타데이터가 수정되었습니다.');
      return updated;
    } catch (err) {
      showError(err, '메타데이터 수정 실패');
      throw err;
    }
  }, []);

  const enrichOne = useCallback(async (stockNo: number) => {
    try {
      const updated = await enrichStock(stockNo);
      setStocks((prev) =>
        prev.map((s) => (s.stockNo === stockNo ? updated : s)),
      );
      showSuccess('프로필 보충 완료');
      return updated;
    } catch (err) {
      showError(err, '프로필 보충 실패');
      throw err;
    }
  }, []);

  return { stocks, totalCount, isLoading, load, toggle, toggleCollection, remove, restore, backfill, bulkRegister, enrichAll, editMeta, enrichOne };
}
