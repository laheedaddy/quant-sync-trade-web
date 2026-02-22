'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchStocks } from '@/lib/api/stock';
import {
  getRecentSymbols,
  addRecentSymbol,
  type RecentSymbol,
} from '@/lib/recent-symbols';
import { useWatchlistStore } from '@/stores/watchlist-store';
import {
  addWatchlistItem,
  createWatchlistGroup,
  removeWatchlistItem,
} from '@/lib/api/watchlist';
import { showError, showSuccess } from '@/lib/toast';
import type { StockSearchResult } from '@/types/stock';
import { Search, Star, Plus } from 'lucide-react';

function SymbolLogo({ url, symbol }: { url: string | null | undefined; symbol: string }) {
  const [imgError, setImgError] = useState(false);
  if (url && !imgError) {
    return (
      <img
        src={url}
        alt=""
        className="w-6 h-6 rounded-full shrink-0 bg-[#1e222d] object-contain self-start mt-0.5"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className="w-6 h-6 rounded-full shrink-0 bg-[#1e222d] flex items-center justify-center text-[9px] font-bold text-[#787b86] self-start mt-0.5">
      {symbol.charAt(0)}
    </div>
  );
}

const STOCK_TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'crypto', label: 'Crypto' },
] as const;

interface SymbolSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (symbol: string) => void;
}

export function SymbolSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: SymbolSearchDialogProps) {
  const [keyword, setKeyword] = useState('');
  const [stockType, setStockType] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [recents, setRecents] = useState<RecentSymbol[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    groups,
    addGroup,
    addItem: addItemToStore,
    removeItem: removeItemFromStore,
  } = useWatchlistStore();

  // All symbols already in any watchlist group
  const watchlistSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) {
      for (const item of g.items) {
        set.add(item.symbol);
      }
    }
    return set;
  }, [groups]);

  // Find watchlist item info by symbol (for removal)
  const findWatchlistItem = useCallback(
    (symbol: string) => {
      for (const g of groups) {
        for (const item of g.items) {
          if (item.symbol === symbol) {
            return {
              groupNo: g.userWatchlistGroupNo,
              itemNo: item.userWatchlistItemNo,
            };
          }
        }
      }
      return null;
    },
    [groups],
  );

  // Load recents when dialog opens
  useEffect(() => {
    if (open) {
      setRecents(getRecentSymbols());
      setKeyword('');
      setStockType('');
      setResults([]);
      setHighlightIdx(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = keyword.trim();
    if (!trimmed) {
      setResults([]);
      setHighlightIdx(0);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchStocks(trimmed, 20, stockType || undefined);
        setResults(data);
        setHighlightIdx(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword, stockType]);

  const isSearchMode = keyword.trim().length > 0;
  const displayList: (StockSearchResult | RecentSymbol)[] =
    isSearchMode ? results : recents;

  const handleSelect = useCallback(
    (item: {
      symbol: string;
      stockName: string;
      exchangeShortName: string;
      stockNameLocal?: string | null;
      sector?: string | null;
    }) => {
      addRecentSymbol({
        symbol: item.symbol,
        stockName: item.stockName,
        exchangeShortName: item.exchangeShortName,
      });
      onSelect(item.symbol);
      onOpenChange(false);
    },
    [onSelect, onOpenChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.min(prev + 1, displayList.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (displayList[highlightIdx]) {
          handleSelect(displayList[highlightIdx]);
        }
      }
    },
    [displayList, highlightIdx, handleSelect],
  );

  const handleToggleWatchlist = useCallback(
    async (e: React.MouseEvent, symbol: string) => {
      e.stopPropagation();

      const existing = findWatchlistItem(symbol);
      if (existing) {
        // Remove from watchlist (optimistic)
        removeItemFromStore(existing.groupNo, existing.itemNo);
        try {
          await removeWatchlistItem(existing.itemNo);
          showSuccess(`${symbol}이(가) 왓치리스트에서 제거되었습니다.`);
        } catch (err) {
          showError(err, '왓치리스트 제거 실패');
        }
        return;
      }

      // Add to watchlist
      try {
        let targetGroup = groups[0];
        if (!targetGroup) {
          const created = await createWatchlistGroup({ groupName: 'Default' });
          addGroup(created);
          targetGroup = created;
        }
        const item = await addWatchlistItem(
          targetGroup.userWatchlistGroupNo,
          { symbol },
        );
        addItemToStore(targetGroup.userWatchlistGroupNo, item);
        showSuccess(`${symbol}이(가) 왓치리스트에 추가되었습니다.`);
      } catch (err) {
        showError(err, '왓치리스트 추가 실패');
      }
    },
    [groups, findWatchlistItem, addGroup, addItemToStore, removeItemFromStore],
  );

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc] sm:max-w-lg p-0 gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Symbol Search</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2e39]">
          <Search className="w-4 h-4 text-[#787b86] shrink-0" />
          <Input
            ref={inputRef}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search symbol, name, or keyword..."
            className="border-0 bg-transparent text-[#d1d4dc] placeholder:text-[#787b86] focus-visible:ring-0 h-8 px-0"
          />
        </div>

        {/* Stock Type Filter */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#2a2e39]">
          {STOCK_TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStockType(filter.value)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                stockType === filter.value
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#1e222d]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Section Label */}
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#787b86]">
          {isSearchMode
            ? loading
              ? 'Searching...'
              : `${results.length} result${results.length !== 1 ? 's' : ''}`
            : 'Recent'}
        </div>

        {/* Results List */}
        <ScrollArea className="max-h-[320px] overflow-auto">
          {displayList.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-[#787b86]">
              {isSearchMode
                ? loading
                  ? ''
                  : 'No results found'
                : 'No recent symbols'}
            </div>
          ) : (
            <div className="pb-1">
              {displayList.map((item, idx) => {
                const searchItem = isSearchMode
                  ? (item as StockSearchResult)
                  : null;
                const inWatchlist = watchlistSymbols.has(item.symbol);

                return (
                  <div
                    key={item.symbol}
                    role="option"
                    aria-selected={idx === highlightIdx}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer ${
                      idx === highlightIdx
                        ? 'bg-[#2a2e39]'
                        : 'hover:bg-[#1e222d]'
                    }`}
                  >
                    {/* Logo */}
                    <SymbolLogo url={searchItem?.logoUrl} symbol={item.symbol} />

                    {/* Symbol + Name (2-line layout) */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-mono font-semibold text-[#d1d4dc]">
                          {item.symbol}
                        </span>
                        {searchItem?.stockType &&
                          searchItem.stockType !== 'stock' && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 ${
                                searchItem.stockType === 'etf'
                                  ? 'border-[#ff9800]/40 text-[#ff9800]'
                                  : searchItem.stockType === 'crypto'
                                    ? 'border-[#ab47bc]/40 text-[#ab47bc]'
                                    : 'border-[#2a2e39] text-[#787b86]'
                              }`}
                            >
                              {searchItem.stockType.toUpperCase()}
                            </Badge>
                          )}
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 border-[#2a2e39] text-[#787b86]"
                        >
                          {item.exchangeShortName}
                        </Badge>
                        {searchItem?.isDelete && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-[#ef5350]/40 text-[#ef5350]">
                            DELETED
                          </Badge>
                        )}
                        {searchItem && !searchItem.isActive && !searchItem.isDelete && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-[#ef5350]/40 text-[#ef5350]">
                            INACTIVE
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-[#787b86] truncate">
                        {item.stockName}
                        {searchItem?.stockNameLocal && (
                          <span className="ml-1">
                            ({searchItem.stockNameLocal})
                          </span>
                        )}
                      </div>
                      {searchItem?.isDelete && (
                        <div className="text-[10px] text-[#ef5350] mt-0.5">
                          삭제된 종목입니다
                        </div>
                      )}
                      {searchItem && !searchItem.isActive && !searchItem.isDelete && (
                        <div className="text-[10px] text-[#ef5350] mt-0.5">
                          해당 종목은 관리되지 않는 종목입니다
                        </div>
                      )}
                    </div>

                    {/* Watchlist toggle button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleWatchlist(e, item.symbol)}
                      className={`shrink-0 p-0.5 transition-colors ${
                        inWatchlist
                          ? 'text-[#2962ff] hover:text-[#ef5350]'
                          : 'text-[#787b86]/40 hover:text-[#787b86]'
                      }`}
                      title={
                        inWatchlist
                          ? 'Remove from watchlist'
                          : 'Add to watchlist'
                      }
                    >
                      {inWatchlist ? (
                        <Star className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
