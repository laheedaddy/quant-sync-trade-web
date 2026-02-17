'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { useStockManagement, useCollectionTargetManagement } from '@/hooks/use-management';
import { EXCHANGES, TIMEFRAMES, COLLECTION_TYPES } from '@/types/management';
import type { CreateStockRequest, CreateCollectionTargetRequest, CollectionTarget } from '@/types/management';

// ──────────────────────────────────────────────
// Stocks Tab
// ──────────────────────────────────────────────

function StocksTab() {
  const { stocks, isLoading, load, create, toggle, remove, syncFmp, syncBinance } = useStockManagement();
  const [syncExchange, setSyncExchange] = useState<string>('NASDAQ');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingBinance, setIsSyncingBinance] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
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
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Name</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Exchange</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Type</th>
              <th className="text-center px-3 py-2 font-medium text-[#787b86]">Active</th>
              <th className="text-center px-3 py-2 font-medium text-[#787b86]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && stocks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[#787b86]">Loading...</td>
              </tr>
            ) : stocks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[#787b86]">No stocks found</td>
              </tr>
            ) : (
              stocks.map((stock) => (
                <tr key={stock.stockNo} className="border-b border-[#2a2e39]/50 hover:bg-[#1e222d]/50">
                  <td className="px-3 py-2 font-mono text-[#d1d4dc]">{stock.symbol}</td>
                  <td className="px-3 py-2 text-[#d1d4dc] max-w-[200px] truncate">{stock.stockName}</td>
                  <td className="px-3 py-2 text-[#787b86]">{stock.exchangeShortName}</td>
                  <td className="px-3 py-2 text-[#787b86]">{stock.stockType}</td>
                  <td className="px-3 py-2 text-center">
                    <Switch
                      size="sm"
                      checked={stock.isActive}
                      onCheckedChange={() => toggle(stock.stockNo, stock.isActive)}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
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
// Collection Targets Tab
// ──────────────────────────────────────────────

function CollectionTargetsTab() {
  const { targets, isLoading, load, create, toggle, remove, backfill } = useCollectionTargetManagement();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [backfillTarget, setBackfillTarget] = useState<CollectionTarget | null>(null);
  const [backfillFrom, setBackfillFrom] = useState('2015-01-01');
  const [backfillTo, setBackfillTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [addForm, setAddForm] = useState<CreateCollectionTargetRequest>({
    symbol: '',
    collectionType: COLLECTION_TYPES[0],
    timeframe: '1day',
  });

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    try {
      await create(addForm);
      setShowAddDialog(false);
      setAddForm({ symbol: '', collectionType: COLLECTION_TYPES[0], timeframe: '1day' });
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

  const handleBackfill = async () => {
    if (!backfillTarget) return;
    setIsBackfilling(true);
    try {
      await backfill(backfillTarget.collectionTargetNo, {
        from: backfillFrom,
        to: backfillTo,
      });
      setBackfillTarget(null);
    } catch {
      // error already handled by hook
    } finally {
      setIsBackfilling(false);
    }
  };

  const openBackfillDialog = (target: CollectionTarget) => {
    setBackfillTarget(target);
    setBackfillFrom('2015-01-01');
    setBackfillTo(new Date().toISOString().split('T')[0]);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="text-xs h-8">
          Add Target
        </Button>
      </div>

      {/* Table */}
      <div className="border border-[#2a2e39] rounded-lg overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#2a2e39] bg-[#1e222d]">
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Symbol</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Timeframe</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Type</th>
              <th className="text-center px-3 py-2 font-medium text-[#787b86]">Active</th>
              <th className="text-left px-3 py-2 font-medium text-[#787b86]">Last Collected</th>
              <th className="text-center px-3 py-2 font-medium text-[#787b86]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && targets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[#787b86]">Loading...</td>
              </tr>
            ) : targets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[#787b86]">No collection targets found</td>
              </tr>
            ) : (
              targets.map((target) => (
                <tr key={target.collectionTargetNo} className="border-b border-[#2a2e39]/50 hover:bg-[#1e222d]/50">
                  <td className="px-3 py-2 font-mono text-[#d1d4dc]">{target.symbol}</td>
                  <td className="px-3 py-2 text-[#787b86]">{target.timeframe}</td>
                  <td className="px-3 py-2 text-[#787b86]">{target.collectionType}</td>
                  <td className="px-3 py-2 text-center">
                    <Switch
                      size="sm"
                      checked={target.isActive}
                      onCheckedChange={() => toggle(target.collectionTargetNo, target.isActive)}
                    />
                  </td>
                  <td className="px-3 py-2 text-[#787b86]">{formatDate(target.lastCollectedAt)}</td>
                  <td className="px-3 py-2 text-center space-x-1">
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-[#2962ff] hover:text-[#2962ff] hover:bg-[#2962ff]/10 text-xs"
                      onClick={() => openBackfillDialog(target)}
                    >
                      Backfill
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-[#ef5350] hover:text-[#ef5350] hover:bg-[#ef5350]/10 text-xs"
                      onClick={() => setDeleteTarget(target.collectionTargetNo)}
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
        Total: {targets.length} targets
      </div>

      {/* Add Target Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#131722] border-[#2a2e39]">
          <DialogHeader>
            <DialogTitle>Add Collection Target</DialogTitle>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Timeframe</Label>
                <Select
                  value={addForm.timeframe}
                  onValueChange={(v) => setAddForm((f) => ({ ...f, timeframe: v }))}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map((tf) => (
                      <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Collection Type</Label>
                <Select
                  value={addForm.collectionType}
                  onValueChange={(v) => setAddForm((f) => ({ ...f, collectionType: v }))}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLECTION_TYPES.map((ct) => (
                      <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Memo (optional)</Label>
              <Input
                value={addForm.memo || ''}
                onChange={(e) => setAddForm((f) => ({ ...f, memo: e.target.value || undefined }))}
                placeholder="Optional memo"
                className="h-8 text-xs bg-[#1e222d] border-[#2a2e39]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!addForm.symbol}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backfill Dialog */}
      <Dialog open={backfillTarget !== null} onOpenChange={(open) => !open && !isBackfilling && setBackfillTarget(null)}>
        <DialogContent className="bg-[#131722] border-[#2a2e39]">
          <DialogHeader>
            <DialogTitle>Backfill Market Data</DialogTitle>
          </DialogHeader>
          {backfillTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#1e222d] border border-[#2a2e39]">
                <span className="font-mono text-sm text-[#d1d4dc]">{backfillTarget.symbol}</span>
                <span className="text-xs text-[#787b86]">{backfillTarget.timeframe}</span>
                <span className="text-xs text-[#787b86]">{backfillTarget.collectionType}</span>
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
                수집 기간이 길수록 시간이 오래 걸릴 수 있습니다.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBackfillTarget(null)}
              disabled={isBackfilling}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBackfill}
              disabled={isBackfilling || !backfillFrom}
            >
              {isBackfilling ? 'Backfilling...' : 'Start Backfill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#131722] border-[#2a2e39]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection Target</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this collection target? This action cannot be undone.
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
          <Tabs defaultValue="stocks">
            <TabsList variant="line" className="mb-4">
              <TabsTrigger value="stocks">Stocks</TabsTrigger>
              <TabsTrigger value="targets">Collection Targets</TabsTrigger>
            </TabsList>
            <TabsContent value="stocks">
              <StocksTab />
            </TabsContent>
            <TabsContent value="targets">
              <CollectionTargetsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
