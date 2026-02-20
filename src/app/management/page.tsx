'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { showSuccess } from '@/lib/toast';
import { EXCHANGES } from '@/types/management';
import type { CreateStockRequest, Stock } from '@/types/management';

// ──────────────────────────────────────────────
// Stocks Page
// ──────────────────────────────────────────────

function StocksContent() {
  const { stocks, isLoading, load, create, toggle, toggleCollection, remove, syncFmp, syncBinance, backfill, collectDailyAll } = useStockManagement();
  const [syncExchange, setSyncExchange] = useState<string>('NASDAQ');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingBinance, setIsSyncingBinance] = useState(false);
  const [isCollectingDaily, setIsCollectingDaily] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [backfillTarget, setBackfillTarget] = useState<Stock | null>(null);
  const [backfillFrom, setBackfillFrom] = useState('2015-01-01');
  const [backfillTo, setBackfillTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [addForm, setAddForm] = useState<CreateStockRequest>({
    symbol: '',
    stockName: '',
    exchange: 'NASDAQ',
    exchangeShortName: 'NASDAQ',
    stockType: 'stock',
  });

  useEffect(() => {
    load();
  }, [load]);

  const handleSyncFmp = async () => {
    setIsSyncing(true);
    try {
      await syncFmp(syncExchange || undefined);
      await load();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncBinance = async () => {
    setIsSyncingBinance(true);
    try {
      await syncBinance();
      await load();
    } finally {
      setIsSyncingBinance(false);
    }
  };

  const handleAdd = async () => {
    try {
      await create(addForm);
      setShowAddDialog(false);
      setAddForm({ symbol: '', stockName: '', exchange: 'NASDAQ', exchangeShortName: 'NASDAQ', stockType: 'stock' });
    } catch {
      // error already handled by hook
    }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await remove(deleteTarget);
    } catch {
      // error already handled by hook
    }
    setDeleteTarget(null);
  };

  const openBackfillDialog = (stock: Stock) => {
    setBackfillTarget(stock);
    setBackfillFrom('2015-01-01');
    setBackfillTo(new Date().toISOString().split('T')[0]);
  };

  const handleBackfill = () => {
    if (!backfillTarget) return;
    const target = backfillTarget;
    setBackfillTarget(null);
    showSuccess(`${target.symbol} backfill 시작됨 (${backfillFrom} ~ ${backfillTo})`);
    backfill(target.stockNo, {
      from: backfillFrom,
      to: backfillTo,
    }).catch(() => {
      // error already handled by hook
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={syncExchange} onValueChange={setSyncExchange}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-[#1e222d] border-[#2a2e39]">
              <SelectValue placeholder="Exchange" />
            </SelectTrigger>
            <SelectContent>
              {EXCHANGES.map((ex) => (
                <SelectItem key={ex} value={ex}>{ex}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncFmp}
            disabled={isSyncing}
            className="text-xs h-8"
          >
            {isSyncing ? 'Syncing...' : 'FMP Sync'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncBinance}
            disabled={isSyncingBinance}
            className="text-xs h-8 border-[#f0b90b]/30 text-[#f0b90b] hover:bg-[#f0b90b]/10"
          >
            {isSyncingBinance ? 'Syncing...' : 'Binance Sync'}
          </Button>
          <div className="w-px h-5 bg-[#2a2e39]" />
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              setIsCollectingDaily(true);
              try {
                await collectDailyAll();
              } finally {
                setIsCollectingDaily(false);
              }
            }}
            disabled={isCollectingDaily}
            className="text-xs h-8 border-[#26a69a]/30 text-[#26a69a] hover:bg-[#26a69a]/10"
          >
            {isCollectingDaily ? 'Collecting...' : 'Collect Daily'}
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="text-xs h-8">
          Add Stock
        </Button>
      </div>

      {/* Table */}
      <div className="border border-[#2a2e39] rounded-lg overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#2a2e39] bg-[#1e222d]">
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Symbol</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">FMP Symbol</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Name</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Exchange</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">ISIN</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Type</th>
              <th className="text-center px-3 py-2 font-medium text-[#787b86]">Active</th>
              <th className="text-center px-3 py-2 font-medium text-[#787b86]">Collect</th>
              <th className="text-center px-3 py-2 font-medium text-[#787b86]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && stocks.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-[#787b86]">Loading...</td>
              </tr>
            ) : stocks.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-[#787b86]">No stocks found</td>
              </tr>
            ) : (
              stocks.map((stock) => (
                <tr key={stock.stockNo} className="border-b border-[#2a2e39]/50 hover:bg-[#1e222d]/50">
                  <td className="px-3 py-2 font-mono text-[#d1d4dc]">{stock.symbol}</td>
                  <td className="px-3 py-2 font-mono text-[#787b86]">{stock.fmpSymbol || '-'}</td>
                  <td className="px-3 py-2 text-[#d1d4dc] max-w-[200px] truncate">{stock.stockName}</td>
                  <td className="px-3 py-2 text-[#787b86]">{stock.exchangeShortName}</td>
                  <td className="px-3 py-2 font-mono text-[#787b86] text-[10px]">{stock.isin || '-'}</td>
                  <td className="px-3 py-2 text-[#787b86]">{stock.stockType}</td>
                  <td className="px-3 py-2 text-center">
                    <Switch
                      size="sm"
                      checked={stock.isActive}
                      onCheckedChange={() => toggle(stock.stockNo, stock.isActive)}
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
                      className="text-[#2962ff] hover:text-[#2962ff] hover:bg-[#2962ff]/10 text-xs"
                      onClick={() => openBackfillDialog(stock)}
                    >
                      Backfill
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-[#ef5350] hover:text-[#ef5350] hover:bg-[#ef5350]/10 text-xs"
                      onClick={() => setDeleteTarget(stock.stockNo)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-[#787b86]">
        Total: {stocks.length} stocks
        {stocks.filter((s) => s.isCollectionActive).length > 0 && (
          <span className="ml-2 text-[#26a69a]">
            ({stocks.filter((s) => s.isCollectionActive).length} collecting)
          </span>
        )}
      </div>

      {/* Add Stock Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#131722] border-[#2a2e39]">
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Symbol</Label>
              <Input
                value={addForm.symbol}
                onChange={(e) => setAddForm((f) => ({ ...f, symbol: e.target.value }))}
                placeholder="AAPL"
                className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={addForm.stockName}
                onChange={(e) => setAddForm((f) => ({ ...f, stockName: e.target.value }))}
                placeholder="Apple Inc."
                className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Exchange</Label>
                <Select
                  value={addForm.exchange}
                  onValueChange={(v) => setAddForm((f) => ({ ...f, exchange: v, exchangeShortName: v }))}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXCHANGES.map((ex) => (
                      <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select
                  value={addForm.stockType}
                  onValueChange={(v) => setAddForm((f) => ({ ...f, stockType: v }))}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">stock</SelectItem>
                    <SelectItem value="etf">etf</SelectItem>
                    <SelectItem value="crypto">crypto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!addForm.symbol || !addForm.stockName}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backfill Dialog */}
      <Dialog open={backfillTarget !== null} onOpenChange={(open) => !open && setBackfillTarget(null)}>
        <DialogContent className="bg-[#131722] border-[#2a2e39]">
          <DialogHeader>
            <DialogTitle>Backfill Market Data</DialogTitle>
          </DialogHeader>
          {backfillTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#1e222d] border border-[#2a2e39]">
                <span className="font-mono text-sm text-[#d1d4dc]">{backfillTarget.symbol}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#2962ff]/20 text-[#2962ff]">All Timeframes</span>
                <span className="text-xs text-[#787b86]">{backfillTarget.exchangeShortName}</span>
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
              onClick={() => setBackfillTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBackfill}
              disabled={!backfillFrom}
            >
              Start Backfill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#131722] border-[#2a2e39]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stock</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stock? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[#ef5350] hover:bg-[#ef5350]/80"
            >
              Delete
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
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold text-[#d1d4dc] mb-4">Management</h2>
          <StocksContent />
        </div>
      </main>
    </div>
  );
}
