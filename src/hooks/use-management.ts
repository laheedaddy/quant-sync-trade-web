'use client';

import { useState, useCallback } from 'react';
import {
  fetchStocks,
  createStock,
  updateStock,
  deleteStock,
  syncStocksFromFmp,
  syncCryptoFromBinance,
  backfillStock,
  collectDaily,
} from '@/lib/api/management';
import type {
  Stock,
  CreateStockRequest,
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

  const collectDailyAll = useCallback(async () => {
    try {
      const result = await collectDaily();
      showSuccess(`일봉 수집 완료: 주식 ${result.stock}건, 크립토 ${result.crypto}건`);
      return result;
    } catch (err) {
      showError(err, '일봉 수집 실패');
      throw err;
    }
  }, []);

  return { stocks, isLoading, load, create, toggle, toggleCollection, remove, syncFmp, syncBinance, backfill, collectDailyAll };
}
