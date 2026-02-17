'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { StockSearchResult } from '@/types/stock';
import { Search } from 'lucide-react';

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
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [recents, setRecents] = useState<RecentSymbol[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recents when dialog opens
  useEffect(() => {
    if (open) {
      setRecents(getRecentSymbols());
      setKeyword('');
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
        const data = await searchStocks(trimmed);
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
  }, [keyword]);

  const isSearchMode = keyword.trim().length > 0;
  const displayList: { symbol: string; stockName: string; exchangeShortName: string }[] =
    isSearchMode ? results : recents;

  const handleSelect = useCallback(
    (item: { symbol: string; stockName: string; exchangeShortName: string }) => {
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

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay for dialog animation
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc] sm:max-w-md p-0 gap-0"
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
            placeholder="Search symbol or name..."
            className="border-0 bg-transparent text-[#d1d4dc] placeholder:text-[#787b86] focus-visible:ring-0 h-8 px-0"
          />
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
              {displayList.map((item, idx) => (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    idx === highlightIdx
                      ? 'bg-[#2a2e39]'
                      : 'hover:bg-[#1e222d]'
                  }`}
                >
                  <span className="text-sm font-mono font-semibold text-[#d1d4dc] min-w-[72px]">
                    {item.symbol}
                  </span>
                  <span className="text-xs text-[#787b86] truncate flex-1">
                    {item.stockName}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-[#2a2e39] text-[#787b86] shrink-0"
                  >
                    {item.exchangeShortName}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
