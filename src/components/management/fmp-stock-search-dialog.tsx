'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchFmpStocks, fetchFmpIndex } from '@/lib/api/management';
import { showError } from '@/lib/toast';
import type { FmpSearchResult, FmpIndex, BulkRegisterItem } from '@/types/management';

interface FmpStockSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (items: BulkRegisterItem[]) => Promise<void>;
}

export function FmpStockSearchDialog({ open, onOpenChange, onRegister }: FmpStockSearchDialogProps) {
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FmpSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cache for index data
  const indexCacheRef = useRef<Record<string, FmpSearchResult[]>>({});

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setTab('search');
      setQuery('');
      setResults([]);
      setSelected(new Set());
      indexCacheRef.current = {};
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await searchFmpStocks(q.trim(), 30);
      setResults(data);
    } catch (err) {
      showError(err, 'FMP 검색 실패');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }, [doSearch]);

  const loadIndex = useCallback(async (index: FmpIndex) => {
    if (indexCacheRef.current[index]) {
      setResults(indexCacheRef.current[index]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchFmpIndex(index);
      indexCacheRef.current[index] = data;
      setResults(data);
    } catch (err) {
      showError(err, `${index.toUpperCase()} 로드 실패`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setTab(value);
    setSelected(new Set());
    if (value === 'search') {
      if (query.trim()) doSearch(query);
      else setResults([]);
    } else {
      loadIndex(value as FmpIndex);
    }
  }, [query, doSearch, loadIndex]);

  const toggleSelect = useCallback((symbol: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }, []);

  const selectableResults = results.filter((r) => !r.isRegistered);

  const toggleSelectAll = useCallback(() => {
    if (selectableResults.length === 0) return;
    const allSelected = selectableResults.every((r) => selected.has(r.symbol));
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableResults.map((r) => r.symbol)));
    }
  }, [selectableResults, selected]);

  const allSelected = selectableResults.length > 0 && selectableResults.every((r) => selected.has(r.symbol));

  const handleRegister = useCallback(async () => {
    const items: BulkRegisterItem[] = results
      .filter((r) => selected.has(r.symbol))
      .map((r) => ({
        symbol: r.symbol,
        name: r.name,
        exchange: r.exchange,
        exchangeShortName: r.exchangeShortName,
      }));

    if (items.length === 0) return;

    setIsRegistering(true);
    try {
      await onRegister(items);
      // Mark newly registered items
      setResults((prev) =>
        prev.map((r) => selected.has(r.symbol) ? { ...r, isRegistered: true } : r),
      );
      // Also update the index cache
      if (tab !== 'search' && indexCacheRef.current[tab]) {
        indexCacheRef.current[tab] = indexCacheRef.current[tab].map((r) =>
          selected.has(r.symbol) ? { ...r, isRegistered: true } : r,
        );
      }
      setSelected(new Set());
    } finally {
      setIsRegistering(false);
    }
  }, [results, selected, onRegister, tab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#131722] border-[#2a2e39] flex flex-col max-w-[calc(100%-2rem)] sm:max-w-3xl max-h-[85vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>FMP Stock Search</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange} className="shrink-0">
          <TabsList className="bg-[#1e222d] border border-[#2a2e39]">
            <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>
            <TabsTrigger value="sp500" className="text-xs">S&P 500</TabsTrigger>
            <TabsTrigger value="nasdaq" className="text-xs">NASDAQ</TabsTrigger>
            <TabsTrigger value="dowjones" className="text-xs">DOW 30</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-3">
            <Input
              placeholder="Search by symbol or name..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]"
              autoFocus
            />
          </TabsContent>
          <TabsContent value="sp500" className="mt-0" />
          <TabsContent value="nasdaq" className="mt-0" />
          <TabsContent value="dowjones" className="mt-0" />
        </Tabs>

        {/* Results Table — flex-1 + min-h-0 + overflow 으로 남은 공간 채움 */}
        <div className="flex-1 min-h-0 border border-[#2a2e39] rounded-lg overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[#1e222d]">
              <tr className="border-b border-[#2a2e39]">
                <th className="w-10 px-3 py-2 text-left">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    disabled={selectableResults.length === 0}
                    className="data-[state=checked]:bg-[#2962ff] data-[state=checked]:border-[#2962ff]"
                  />
                </th>
                <th className="px-3 py-2 text-left font-medium text-[#787b86]">Symbol</th>
                <th className="px-3 py-2 text-left font-medium text-[#787b86]">Name</th>
                <th className="px-3 py-2 text-left font-medium text-[#787b86]">
                  {tab === 'search' ? 'Exchange' : 'Sector'}
                </th>
                <th className="px-3 py-2 text-center font-medium text-[#787b86]">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[#787b86]">Loading...</td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[#787b86]">
                    {tab === 'search' ? 'Enter a keyword to search' : 'No data'}
                  </td>
                </tr>
              ) : (
                results.map((item) => (
                  <tr
                    key={item.symbol}
                    className="border-b border-[#2a2e39]/50 hover:bg-[#1e222d]/50 cursor-pointer"
                    onClick={() => !item.isRegistered && toggleSelect(item.symbol)}
                  >
                    <td className="w-10 px-3 py-1.5">
                      <Checkbox
                        checked={selected.has(item.symbol)}
                        onCheckedChange={() => toggleSelect(item.symbol)}
                        disabled={item.isRegistered}
                        className="data-[state=checked]:bg-[#2962ff] data-[state=checked]:border-[#2962ff]"
                      />
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[#d1d4dc]">{item.symbol}</td>
                    <td className="px-3 py-1.5 text-[#d1d4dc] max-w-[240px] truncate">{item.name}</td>
                    <td className="px-3 py-1.5 text-[#787b86]">
                      {tab === 'search' ? (item.exchangeShortName || item.exchange || '-') : (item.sector || '-')}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {item.isRegistered && (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-[#26a69a]/20 text-[#26a69a]">
                          Registered
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter className="shrink-0 flex items-center justify-between sm:justify-between">
          <span className="text-xs text-[#787b86]">
            {results.length > 0 && `${results.length} results`}
            {selected.size > 0 && ` / ${selected.size} selected`}
          </span>
          <Button
            size="sm"
            onClick={handleRegister}
            disabled={selected.size === 0 || isRegistering}
            className="text-xs"
          >
            {isRegistering ? 'Registering...' : `Register Selected (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
