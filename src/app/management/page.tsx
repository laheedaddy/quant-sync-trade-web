'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useStockManagement } from '@/hooks/use-management';
import { FmpStockSearchDialog } from '@/components/management/fmp-stock-search-dialog';
import { showSuccess } from '@/lib/toast';
import type { Stock, StockQuery } from '@/types/management';
import { EXCHANGES } from '@/types/management';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatMktCap(value: number | null): string {
  if (value == null) return '-';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return value.toLocaleString();
}

function formatDateOnly(value: string | null): string {
  if (!value) return '-';
  return value.slice(0, 10);
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] text-[#787b86] w-[90px] shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-[#d1d4dc] break-all">{value || <span className="text-[#787b86]">-</span>}</span>
    </div>
  );
}

const PAGE_SIZES = [20, 50, 100] as const;

// ──────────────────────────────────────────────
// Stocks Page
// ──────────────────────────────────────────────

function StocksContent() {
  const { stocks, totalCount, isLoading, load, toggle, toggleCollection, remove, restore, backfill, bulkRegister, enrichAll, editMeta, enrichOne } = useStockManagement();
  const [isEnriching, setIsEnriching] = useState(false);
  const [showFmpSearch, setShowFmpSearch] = useState(false);

  // Generic confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    confirmClassName?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [backfillTargets, setBackfillTargets] = useState<Stock[]>([]);
  const [backfillFrom, setBackfillFrom] = useState('2015-01-01');
  const [backfillTo, setBackfillTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState({ current: 0, total: 0 });
  const [editTarget, setEditTarget] = useState<Stock | null>(null);
  const [editLocalName, setEditLocalName] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [isEnrichingOne, setIsEnrichingOne] = useState(false);

  // Selection state
  const [selectedNos, setSelectedNos] = useState<Set<number>>(new Set());
  const [batchAction, setBatchAction] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Search / Filter / Pagination state
  const [keyword, setKeyword] = useState('');
  const [filterExchange, setFilterExchange] = useState('__all__');
  const [filterStockType, setFilterStockType] = useState('__all__');
  const [filterActive, setFilterActive] = useState('__all__');
  const [filterCollecting, setFilterCollecting] = useState('__all__');
  const [showDeleted, setShowDeleted] = useState(false);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentOffset, setCurrentOffset] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildQuery = useCallback((): StockQuery => {
    const q: StockQuery = {
      offset: currentOffset,
      limit: pageSize,
    };
    if (keyword.trim()) q.keyword = keyword.trim();
    if (showDeleted) q.isDelete = true;
    if (filterActive === 'active') q.isActive = true;
    if (filterActive === 'inactive') q.isActive = false;
    if (filterCollecting === 'collecting') q.isCollectionActive = true;
    if (filterCollecting === 'not_collecting') q.isCollectionActive = false;
    if (filterExchange !== '__all__') q.exchange = filterExchange;
    if (filterStockType !== '__all__') q.stockType = filterStockType;
    return q;
  }, [currentOffset, pageSize, keyword, showDeleted, filterActive, filterCollecting, filterExchange, filterStockType]);

  const reload = useCallback(() => {
    load(buildQuery());
  }, [load, buildQuery]);

  // Initial load + reload on filter/pagination change (except keyword which uses debounce)
  useEffect(() => {
    reload();
  }, [reload]);

  // Keyword debounce
  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
    setCurrentOffset(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // reload will fire via useEffect because keyword changed
    }, 300);
  }, []);

  const resetFiltersAndOffset = useCallback(() => {
    setCurrentOffset(0);
    setSelectedNos(new Set());
  }, []);

  const handleFilterChange = useCallback((setter: (v: string) => void, value: string) => {
    setter(value);
    resetFiltersAndOffset();
  }, [resetFiltersAndOffset]);

  const toggleSelect = useCallback((stockNo: number) => {
    setSelectedNos((prev) => {
      const next = new Set(prev);
      if (next.has(stockNo)) next.delete(stockNo);
      else next.add(stockNo);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedNos.size === stocks.length) {
      setSelectedNos(new Set());
    } else {
      setSelectedNos(new Set(stocks.map((s) => s.stockNo)));
    }
  }, [stocks, selectedNos.size]);

  const isAllSelected = stocks.length > 0 && selectedNos.size === stocks.length;
  const isSomeSelected = selectedNos.size > 0 && selectedNos.size < stocks.length;

  // Pagination helpers
  const currentPage = Math.floor(currentOffset / pageSize) + 1;
  const totalPages = Math.ceil(totalCount / pageSize);
  const showingFrom = totalCount === 0 ? 0 : currentOffset + 1;
  const showingTo = Math.min(currentOffset + pageSize, totalCount);

  const handleBatchEnrich = useCallback(async () => {
    const nos = Array.from(selectedNos);
    setBatchAction('enrich');
    setBatchProgress({ current: 0, total: nos.length });
    let success = 0;
    for (let i = 0; i < nos.length; i++) {
      setBatchProgress({ current: i + 1, total: nos.length });
      try {
        await enrichOne(nos[i]);
        success++;
      } catch {
        // individual errors shown by hook
      }
    }
    setBatchAction(null);
    showSuccess(`Enrich 완료: ${success}/${nos.length}건`);
    setSelectedNos(new Set());
  }, [selectedNos, enrichOne]);

  const handleBatchDelete = useCallback(async () => {
    const nos = Array.from(selectedNos);
    setBatchAction('delete');
    setBatchProgress({ current: 0, total: nos.length });
    let success = 0;
    for (let i = 0; i < nos.length; i++) {
      setBatchProgress({ current: i + 1, total: nos.length });
      try {
        await remove(nos[i]);
        success++;
      } catch {
        // individual errors shown by hook
      }
    }
    setBatchAction(null);
    showSuccess(`삭제 완료: ${success}/${nos.length}건`);
    setSelectedNos(new Set());
    reload();
  }, [selectedNos, remove, reload]);


  const openBackfillDialog = useCallback((targets: Stock[]) => {
    setBackfillTargets(targets);
    setBackfillFrom('2015-01-01');
    setBackfillTo(new Date().toISOString().split('T')[0]);
    setIsBackfilling(false);
    setBackfillProgress({ current: 0, total: 0 });
  }, []);

  const handleBackfill = useCallback(async () => {
    if (backfillTargets.length === 0) return;
    const targets = [...backfillTargets];
    const body = { from: backfillFrom, to: backfillTo };

    if (targets.length === 1) {
      // Single stock: fire and forget (same as before)
      setBackfillTargets([]);
      showSuccess(`${targets[0].symbol} backfill 시작됨 (${backfillFrom} ~ ${backfillTo})`);
      backfill(targets[0].stockNo, body).catch(() => {});
      return;
    }

    // Multi: run sequentially with progress
    setIsBackfilling(true);
    setBackfillProgress({ current: 0, total: targets.length });
    let success = 0;
    for (let i = 0; i < targets.length; i++) {
      setBackfillProgress({ current: i + 1, total: targets.length });
      try {
        await backfill(targets[i].stockNo, body);
        success++;
      } catch {
        // individual errors shown by hook
      }
    }
    setIsBackfilling(false);
    setBackfillTargets([]);
    showSuccess(`Backfill 완료: ${success}/${targets.length}건`);
    setSelectedNos(new Set());
  }, [backfillTargets, backfillFrom, backfillTo, backfill]);

  const openEditDialog = (stock: Stock) => {
    setEditTarget(stock);
    setEditLocalName(stock.stockNameLocal || '');
    setEditTags(stock.tags || '');
  };

  const handleSaveMeta = async () => {
    if (!editTarget) return;
    setIsSavingMeta(true);
    try {
      const updated = await editMeta(editTarget.stockNo, {
        stockNameLocal: editLocalName || null,
        tags: editTags || null,
      });
      if (updated) setEditTarget(updated);
    } catch {
      // error handled by hook
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleEnrichOne = async () => {
    if (!editTarget) return;
    setIsEnrichingOne(true);
    try {
      const updated = await enrichOne(editTarget.stockNo);
      setEditTarget(updated);
    } catch {
      // error handled by hook
    } finally {
      setIsEnrichingOne(false);
    }
  };

  const colSpan = 12;

  return (
    <div className="space-y-3">
      {/* Search / Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Search symbol / name / local name..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="h-8 w-56 text-xs bg-[#1e222d] border-[#2a2e39] placeholder:text-[#787b86]"
        />
        <Select value={filterExchange} onValueChange={(v) => handleFilterChange(setFilterExchange, v)}>
          <SelectTrigger size="sm" className="h-8 w-[120px] text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
            <SelectValue placeholder="Exchange" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
            <SelectItem value="__all__" className="text-xs">All Exchanges</SelectItem>
            {EXCHANGES.map((ex) => (
              <SelectItem key={ex} value={ex} className="text-xs">{ex}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStockType} onValueChange={(v) => handleFilterChange(setFilterStockType, v)}>
          <SelectTrigger size="sm" className="h-8 w-[100px] text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
            <SelectItem value="__all__" className="text-xs">All Types</SelectItem>
            <SelectItem value="stock" className="text-xs">Stock</SelectItem>
            <SelectItem value="etf" className="text-xs">ETF</SelectItem>
            <SelectItem value="crypto" className="text-xs">Crypto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={(v) => handleFilterChange(setFilterActive, v)}>
          <SelectTrigger size="sm" className="h-8 w-[100px] text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
            <SelectValue placeholder="Active" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
            <SelectItem value="__all__" className="text-xs">All</SelectItem>
            <SelectItem value="active" className="text-xs">Active</SelectItem>
            <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCollecting} onValueChange={(v) => handleFilterChange(setFilterCollecting, v)}>
          <SelectTrigger size="sm" className="h-8 w-[130px] text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
            <SelectValue placeholder="Collecting" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
            <SelectItem value="__all__" className="text-xs">All</SelectItem>
            <SelectItem value="collecting" className="text-xs">Collecting</SelectItem>
            <SelectItem value="not_collecting" className="text-xs">Not Collecting</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="show-deleted"
            checked={showDeleted}
            onCheckedChange={(checked) => {
              setShowDeleted(checked === true);
              resetFiltersAndOffset();
            }}
            className="data-[state=checked]:bg-[#ef5350] data-[state=checked]:border-[#ef5350]"
          />
          <label htmlFor="show-deleted" className="text-xs text-[#787b86] cursor-pointer select-none">
            Show deleted
          </label>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {selectedNos.size > 0 ? (
            <>
              <span className="text-xs text-[#d1d4dc] font-medium">{selectedNos.size} selected</span>
              <div className="w-px h-5 bg-[#2a2e39]" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmDialog({
                  title: `${selectedNos.size}개 종목 Enrich`,
                  description: `선택한 ${selectedNos.size}개 종목의 프로필을 FMP에서 보충하시겠습니까?`,
                  confirmLabel: 'Enrich',
                  onConfirm: handleBatchEnrich,
                })}
                disabled={batchAction !== null}
                className="text-xs h-8 border-[#ab47bc]/30 text-[#ab47bc] hover:bg-[#ab47bc]/10"
              >
                {batchAction === 'enrich' ? `Enriching ${batchProgress.current}/${batchProgress.total}...` : 'Enrich Selected'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const targets = stocks.filter((s) => selectedNos.has(s.stockNo));
                  openBackfillDialog(targets);
                }}
                disabled={batchAction !== null}
                className="text-xs h-8 border-[#2962ff]/30 text-[#2962ff] hover:bg-[#2962ff]/10"
              >
                Backfill Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmDialog({
                  title: `${selectedNos.size}개 종목 삭제`,
                  description: `선택한 ${selectedNos.size}개 종목을 삭제하시겠습니까?\n각 종목의 시그널 채널이 중지되고 수집이 비활성화됩니다.`,
                  confirmLabel: '삭제',
                  confirmClassName: 'bg-[#ef5350] hover:bg-[#ef5350]/80',
                  onConfirm: handleBatchDelete,
                })}
                disabled={batchAction !== null}
                className="text-xs h-8 border-[#ef5350]/30 text-[#ef5350] hover:bg-[#ef5350]/10"
              >
                {batchAction === 'delete' ? `Deleting ${batchProgress.current}/${batchProgress.total}...` : 'Delete Selected'}
              </Button>
              <div className="w-px h-5 bg-[#2a2e39]" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedNos(new Set())}
                disabled={batchAction !== null}
                className="text-xs h-8 text-[#787b86]"
              >
                Clear
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  setIsEnriching(true);
                  try {
                    const { totalEnriched, totalReconciled } = await enrichAll();
                    showSuccess(`Enrich 완료: ${totalEnriched}건 보충, ${totalReconciled}건 병합`);
                    if (totalEnriched > 0 || totalReconciled > 0) reload();
                  } catch {
                    // individual batch errors shown by hook
                  } finally {
                    setIsEnriching(false);
                  }
                }}
                disabled={isEnriching}
                className="text-xs h-8 border-[#ab47bc]/30 text-[#ab47bc] hover:bg-[#ab47bc]/10"
              >
                {isEnriching ? 'Enriching...' : 'Enrich All'}
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFmpSearch(true)}
            className="text-xs h-8 border-[#2962ff]/30 text-[#2962ff] hover:bg-[#2962ff]/10"
          >
            FMP Search
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#2a2e39] rounded-lg overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#2a2e39] bg-[#1e222d]">
              <th className="w-10 px-3 py-2">
                <Checkbox
                  checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleSelectAll}
                  disabled={stocks.length === 0}
                  className="data-[state=checked]:bg-[#2962ff] data-[state=checked]:border-[#2962ff]"
                />
              </th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Symbol</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Name</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Exchange</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Sector</th>
              <th className="text-right px-3 py-2 font-medium text-[#787b86]">MktCap</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Type</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Data Range</th>
              <th className="text-center px-3 py-2 font-medium text-[#787b86]">Active</th>
              <th className="text-center px-3 py-2 font-medium text-[#787b86]">Collect</th>
              <th className="text-center px-3 py-2 font-medium text-[#787b86]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && stocks.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-3 py-8 text-center text-[#787b86]">Loading...</td>
              </tr>
            ) : stocks.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-3 py-8 text-center text-[#787b86]">No stocks found</td>
              </tr>
            ) : (
              stocks.map((stock) => (
                <tr key={stock.stockNo} className={`border-b border-[#2a2e39]/50 hover:bg-[#1e222d]/50 ${selectedNos.has(stock.stockNo) ? 'bg-[#2962ff]/5' : ''} ${stock.isDelete ? 'opacity-50' : ''}`}>
                  <td className="w-10 px-3 py-2">
                    <Checkbox
                      checked={selectedNos.has(stock.stockNo)}
                      onCheckedChange={() => toggleSelect(stock.stockNo)}
                      className="data-[state=checked]:bg-[#2962ff] data-[state=checked]:border-[#2962ff]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {stock.logoUrl && (
                        <img
                          src={stock.logoUrl}
                          alt=""
                          className="w-4 h-4 rounded-sm object-contain bg-white/10"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <span className="font-mono font-semibold text-[#d1d4dc]">{stock.symbol}</span>
                      {stock.isDelete && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-[#ef5350]/40 text-[#ef5350]">DELETED</Badge>
                      )}
                    </div>
                    {stock.stockNameLocal && (
                      <span className="text-[10px] text-[#787b86]">{stock.stockNameLocal}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[#d1d4dc] max-w-[180px] truncate">{stock.stockName}</td>
                  <td className="px-3 py-2">
                    <span className="text-[#d1d4dc]">{stock.exchangeShortName || stock.exchange || '-'}</span>
                    {stock.fmpSymbol && stock.fmpSymbol !== stock.symbol && (
                      <div className="text-[10px] text-[#787b86] font-mono">{stock.fmpSymbol}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[#787b86] max-w-[120px] truncate">{stock.sector || '-'}</td>
                  <td className="px-3 py-2 text-right font-mono text-[#787b86]">{formatMktCap(stock.mktCap)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[#787b86]">{stock.stockType}</span>
                      {stock.isEtf && <Badge variant="outline" className="text-[9px] px-1 py-0 border-[#ff9800]/30 text-[#ff9800]">ETF</Badge>}
                      {stock.isAdr && <Badge variant="outline" className="text-[9px] px-1 py-0 border-[#ab47bc]/30 text-[#ab47bc]">ADR</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[#787b86] whitespace-nowrap">
                    {stock.minTradedAt && stock.maxTradedAt ? (
                      <span className="font-mono text-[10px]">
                        {formatDateOnly(stock.minTradedAt)} ~ {formatDateOnly(stock.maxTradedAt)}
                      </span>
                    ) : (
                      <span className="text-[#787b86]">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Switch
                      size="sm"
                      checked={stock.isActive}
                      onCheckedChange={() => {
                        if (stock.isActive) {
                          // 비활성화: 확인 필요
                          setConfirmDialog({
                            title: `${stock.symbol} 비활성화`,
                            description: `${stock.symbol}을(를) 비활성화하시겠습니까?\n시그널 채널이 중지되고 수집도 함께 비활성화됩니다.`,
                            confirmLabel: '비활성화',
                            confirmClassName: 'bg-[#ef5350] hover:bg-[#ef5350]/80',
                            onConfirm: async () => {
                              await toggle(stock.stockNo, stock.isActive);
                              reload();
                            },
                          });
                        } else {
                          // 활성화: 확인 필요
                          setConfirmDialog({
                            title: `${stock.symbol} 활성화`,
                            description: `${stock.symbol}을(를) 활성화하시겠습니까?`,
                            confirmLabel: '활성화',
                            onConfirm: () => toggle(stock.stockNo, stock.isActive),
                          });
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Switch
                      size="sm"
                      checked={stock.isCollectionActive}
                      onCheckedChange={() => toggleCollection(stock.stockNo, stock.isCollectionActive)}
                    />
                  </td>
                  <td className="px-3 py-2 text-center space-x-1">
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-[#d1d4dc] hover:text-[#d1d4dc] hover:bg-[#2a2e39] text-xs"
                      onClick={() => openEditDialog(stock)}
                    >
                      Detail
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-[#2962ff] hover:text-[#2962ff] hover:bg-[#2962ff]/10 text-xs"
                      onClick={() => openBackfillDialog([stock])}
                    >
                      Backfill
                    </Button>
                    {stock.isDelete ? (
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-[#26a69a] hover:text-[#26a69a] hover:bg-[#26a69a]/10 text-xs"
                        onClick={() => setConfirmDialog({
                          title: `${stock.symbol} 복원`,
                          description: `${stock.symbol}을(를) 복원하시겠습니까?\nisActive=true로 복원됩니다.`,
                          confirmLabel: '복원',
                          onConfirm: async () => {
                            await restore(stock.stockNo);
                            reload();
                          },
                        })}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-[#ef5350] hover:text-[#ef5350] hover:bg-[#ef5350]/10 text-xs"
                        onClick={() => setConfirmDialog({
                          title: `${stock.symbol} 삭제`,
                          description: `${stock.symbol}을(를) 삭제하시겠습니까?\nActive, Collect가 비활성화되고 시그널 채널이 중지됩니다.`,
                          confirmLabel: '삭제',
                          confirmClassName: 'bg-[#ef5350] hover:bg-[#ef5350]/80',
                          onConfirm: async () => {
                            await remove(stock.stockNo);
                            reload();
                          },
                        })}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-[#787b86]">
          {totalCount > 0 ? (
            <>Showing {showingFrom}-{showingTo} of {totalCount}</>
          ) : (
            <>No results</>
          )}
          {stocks.filter((s) => s.isCollectionActive).length > 0 && (
            <span className="ml-2 text-[#26a69a]">
              ({stocks.filter((s) => s.isCollectionActive).length} collecting on this page)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentOffset(0); }}>
            <SelectTrigger size="sm" className="h-7 w-[80px] text-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)} className="text-xs">{s} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentOffset(Math.max(0, currentOffset - pageSize))}
            disabled={currentOffset === 0}
            className="text-xs h-7 px-3 border-[#2a2e39] text-[#d1d4dc] disabled:opacity-30"
          >
            Prev
          </Button>
          <span className="text-xs text-[#787b86]">
            {currentPage} / {totalPages || 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentOffset(currentOffset + pageSize)}
            disabled={currentOffset + pageSize >= totalCount}
            className="text-xs h-7 px-3 border-[#2a2e39] text-[#d1d4dc] disabled:opacity-30"
          >
            Next
          </Button>
        </div>
      </div>

      {/* FMP Stock Search Dialog */}
      <FmpStockSearchDialog
        open={showFmpSearch}
        onOpenChange={setShowFmpSearch}
        onRegister={async (items) => {
          await bulkRegister(items);
          reload();
        }}
      />

      {/* Backfill Dialog */}
      <Dialog open={backfillTargets.length > 0} onOpenChange={(open) => !open && !isBackfilling && setBackfillTargets([])}>
        <DialogContent className="bg-[#131722] border-[#2a2e39]">
          <DialogHeader>
            <DialogTitle>
              Backfill Market Data
              {backfillTargets.length > 1 && (
                <span className="ml-2 text-sm font-normal text-[#787b86]">({backfillTargets.length} stocks)</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {backfillTargets.length > 0 && (
            <div className="space-y-4">
              {/* Target stocks */}
              {backfillTargets.length === 1 ? (
                <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#1e222d] border border-[#2a2e39]">
                  <span className="font-mono text-sm text-[#d1d4dc]">{backfillTargets[0].symbol}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#2962ff]/20 text-[#2962ff]">All Timeframes</span>
                  <span className="text-xs text-[#787b86]">{backfillTargets[0].exchangeShortName}</span>
                </div>
              ) : (
                <div className="px-3 py-2 rounded-md bg-[#1e222d] border border-[#2a2e39] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#2962ff]/20 text-[#2962ff]">All Timeframes</span>
                    {isBackfilling && (
                      <span className="text-xs text-[#787b86]">
                        {backfillProgress.current}/{backfillProgress.total} processing...
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {backfillTargets.map((s, i) => (
                      <span
                        key={s.stockNo}
                        className={`inline-block text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isBackfilling && i < backfillProgress.current
                            ? 'bg-[#26a69a]/20 text-[#26a69a]'
                            : isBackfilling && i === backfillProgress.current
                              ? 'bg-[#2962ff]/20 text-[#2962ff]'
                              : 'bg-[#2a2e39]/50 text-[#787b86]'
                        }`}
                      >
                        {s.symbol}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '1D', days: 1 },
                  { label: '1W', days: 7 },
                  { label: '1M', days: 30 },
                  { label: '6M', days: 183 },
                  { label: '1Y', days: 365 },
                  { label: '5Y', days: 1826 },
                ].map(({ label, days }) => {
                  const d = new Date();
                  d.setDate(d.getDate() - days);
                  const val = d.toISOString().split('T')[0];
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setBackfillFrom(val)}
                      disabled={isBackfilling}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        backfillFrom === val
                          ? 'bg-[#2962ff]/20 border-[#2962ff] text-[#2962ff]'
                          : 'bg-[#1e222d] border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] hover:border-[#363a45]'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={backfillFrom}
                    onChange={(e) => setBackfillFrom(e.target.value)}
                    min="2015-01-01"
                    max={backfillTo}
                    disabled={isBackfilling}
                    className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={backfillTo}
                    onChange={(e) => setBackfillTo(e.target.value)}
                    min={backfillFrom}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={isBackfilling}
                    className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]"
                  />
                </div>
              </div>
              <p className="text-xs text-[#787b86]">
                전체 타임프레임(1min~1year)을 일괄 수집합니다. 수집 기간이 길수록 시간이 오래 걸릴 수 있습니다.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBackfillTargets([])}
              disabled={isBackfilling}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBackfill}
              disabled={!backfillFrom || isBackfilling}
            >
              {isBackfilling
                ? `Backfilling ${backfillProgress.current}/${backfillProgress.total}...`
                : backfillTargets.length > 1
                  ? `Start Backfill (${backfillTargets.length})`
                  : 'Start Backfill'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Detail / Edit Dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="bg-[#131722] border-[#2a2e39] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Stock Detail</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-5 pr-3">
                {/* Header */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-[#1e222d] border border-[#2a2e39]">
                  {editTarget.logoUrl && (
                    <img
                      src={editTarget.logoUrl}
                      alt=""
                      className="w-8 h-8 rounded object-contain bg-white/10"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[#d1d4dc]">{editTarget.symbol}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#2a2e39] text-[#787b86]">
                        {editTarget.exchangeShortName || 'N/A'}
                      </Badge>
                      {editTarget.isEtf && <Badge variant="outline" className="text-[9px] px-1 py-0 border-[#ff9800]/30 text-[#ff9800]">ETF</Badge>}
                      {editTarget.isAdr && <Badge variant="outline" className="text-[9px] px-1 py-0 border-[#ab47bc]/30 text-[#ab47bc]">ADR</Badge>}
                    </div>
                    <span className="text-xs text-[#787b86] truncate block">{editTarget.stockName}</span>
                  </div>
                </div>

                {/* Identification */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#787b86]">Identification</h4>
                  <div className="px-3 py-2 rounded-md bg-[#1e222d]/50 space-y-1">
                    <InfoRow label="FMP Symbol" value={<span className="font-mono">{editTarget.fmpSymbol}</span>} />
                    <InfoRow label="ISIN" value={<span className="font-mono">{editTarget.isin}</span>} />
                    <InfoRow label="CIK" value={<span className="font-mono">{editTarget.cik}</span>} />
                    <InfoRow label="Stock Type" value={editTarget.stockType} />
                  </div>
                </div>

                {/* Company Info */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#787b86]">Company Info</h4>
                  <div className="px-3 py-2 rounded-md bg-[#1e222d]/50 space-y-1">
                    <InfoRow label="Exchange" value={editTarget.exchangeShortName ? `${editTarget.exchange} (${editTarget.exchangeShortName})` : editTarget.exchange || '-'} />
                    <InfoRow label="Sector" value={editTarget.sector} />
                    <InfoRow label="Industry" value={editTarget.industry} />
                    <InfoRow label="Country" value={editTarget.country} />
                    <InfoRow label="Currency" value={editTarget.currency} />
                    <InfoRow label="Market Cap" value={formatMktCap(editTarget.mktCap)} />
                    <InfoRow label="Employees" value={editTarget.fullTimeEmployees?.toLocaleString()} />
                    <InfoRow label="IPO Date" value={editTarget.ipoDate} />
                    <InfoRow label="Website" value={
                      editTarget.website
                        ? <a href={editTarget.website} target="_blank" rel="noopener noreferrer" className="text-[#2962ff] hover:underline">{editTarget.website}</a>
                        : null
                    } />
                  </div>
                  {editTarget.description && (
                    <p className="text-[10px] text-[#787b86] leading-relaxed px-3 line-clamp-4">{editTarget.description}</p>
                  )}
                </div>

                {/* Search Metadata (Editable) */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#787b86]">Search Metadata</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Local Name (한글명)</Label>
                      <Input
                        value={editLocalName}
                        onChange={(e) => setEditLocalName(e.target.value)}
                        placeholder="ex: 구글, 삼성전자, 애플"
                        className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]"
                      />
                      <p className="text-[10px] text-[#787b86]">차트 검색에서 한글로 검색할 수 있습니다.</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tags (검색 태그)</Label>
                      <Input
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="ex: 구글,알파벳,Alphabet,검색엔진"
                        className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]"
                      />
                      <p className="text-[10px] text-[#787b86]">콤마로 구분하여 여러 태그를 입력하세요.</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="flex !justify-between">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={handleEnrichOne}
                disabled={isEnrichingOne || !editTarget?.fmpSymbol}
                className="text-xs h-7 border-[#ab47bc]/30 text-[#ab47bc] hover:bg-[#ab47bc]/10"
              >
                {isEnrichingOne ? 'Enriching...' : 'Enrich Profile'}
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditTarget(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleSaveMeta}
                disabled={isSavingMeta}
              >
                {isSavingMeta ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generic Confirm Dialog */}
      <AlertDialog open={confirmDialog !== null} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent className="bg-[#131722] border-[#2a2e39]">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {confirmDialog?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await confirmDialog?.onConfirm();
                setConfirmDialog(null);
              }}
              className={confirmDialog?.confirmClassName}
            >
              {confirmDialog?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ──────────────────────────────────────────────
// Management Page
// ──────────────────────────────────────────────

export default function ManagementPage() {
  return (
    <div className="flex flex-col h-screen bg-[#0a0e17]">
      <Header />
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: { background: '#1e222d', border: '1px solid #2a2e39', color: '#d1d4dc' },
        }}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold text-[#d1d4dc] mb-4">Management</h2>
          <StocksContent />
        </div>
      </main>
    </div>
  );
}
