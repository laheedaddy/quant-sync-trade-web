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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { searchStocks } from '@/lib/api/stock';
import type { StockSearchResult } from '@/types/stock';
import type { WatchlistGroup, AddWatchlistItemRequest } from '@/types/watchlist';

interface AddWatchlistItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: WatchlistGroup[];
  targetGroupNo: number | null;
  onAdd: (groupNo: number, body: AddWatchlistItemRequest) => Promise<unknown>;
}

export function AddWatchlistItemDialog({
  open,
  onOpenChange,
  groups,
  targetGroupNo,
  onAdd,
}: AddWatchlistItemDialogProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroupNo, setSelectedGroupNo] = useState<string>('');
  const [highlightIdx, setHighlightIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize selected group when dialog opens
  useEffect(() => {
    if (open) {
      setKeyword('');
      setResults([]);
      setHighlightIdx(0);
      const groupNo = targetGroupNo ?? groups[0]?.userWatchlistGroupNo;
      setSelectedGroupNo(groupNo ? String(groupNo) : '');
    }
  }, [open, targetGroupNo, groups]);

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

  const handleSelect = useCallback(
    async (item: StockSearchResult) => {
      const groupNo = Number(selectedGroupNo);
      if (!groupNo) return;
      try {
        await onAdd(groupNo, { symbol: item.symbol });
        // Keep dialog open for adding more
        setKeyword('');
        setResults([]);
      } catch {
        // error handled in hook
      }
    },
    [selectedGroupNo, onAdd],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[highlightIdx]) {
          handleSelect(results[highlightIdx]);
        }
      }
    },
    [results, highlightIdx, handleSelect],
  );

  // Auto-focus input
  useEffect(() => {
    if (open) {
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
          <DialogTitle>종목 검색</DialogTitle>
        </DialogHeader>

        {/* Group selector */}
        {groups.length > 1 && (
          <div className="px-3 py-2 border-b border-[#2a2e39]">
            <Select value={selectedGroupNo} onValueChange={setSelectedGroupNo}>
              <SelectTrigger className="w-full h-7 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]">
                <SelectValue placeholder="그룹 선택..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                {groups.map((g) => (
                  <SelectItem
                    key={g.userWatchlistGroupNo}
                    value={String(g.userWatchlistGroupNo)}
                    className="text-xs text-[#d1d4dc]"
                  >
                    {g.groupName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
          {keyword.trim()
            ? loading
              ? 'Searching...'
              : `${results.length} result${results.length !== 1 ? 's' : ''}`
            : 'Type to search'}
        </div>

        {/* Results List */}
        <ScrollArea className="max-h-[320px] overflow-auto">
          {results.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-[#787b86]">
              {keyword.trim()
                ? loading
                  ? ''
                  : 'No results found'
                : 'Enter a symbol or stock name'}
            </div>
          ) : (
            <div className="pb-1">
              {results.map((item, idx) => (
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
