'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { ChevronDown, ChevronRight, GripVertical, Plus, Search, Star, Trash2, X, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useWatchlist } from '@/hooks/use-watchlist';
import { useRealtimeQuote } from '@/hooks/use-realtime-quote';
import { useChartStore } from '@/stores/chart-store';
import { AddWatchlistItemDialog } from './add-watchlist-item-dialog';
import { showSuccess } from '@/lib/toast';
import type { WatchlistGroup, WatchlistItem } from '@/types/watchlist';

// ─── Draggable WatchlistItemRow ───

function DraggableWatchlistItemRow({
  item,
  groupNo,
  onRemove,
  isSelected,
}: {
  item: WatchlistItem;
  groupNo: number;
  onRemove: (groupNo: number, itemNo: number) => void;
  isSelected: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `item-${item.userWatchlistItemNo}`,
    data: { item, groupNo },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 px-3 py-1.5 hover:bg-[#1e222d] transition-colors group/item ${
        isDragging ? 'opacity-30' : ''
      }${isSelected ? ' bg-[#2962ff]/10 border-l-2 border-l-[#2962ff]' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...listeners}
        {...attributes}
        className="text-[#787b86] hover:text-[#d1d4dc] cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3 h-3" />
      </button>

      {/* Content */}
      <WatchlistItemContent item={item} groupNo={groupNo} onRemove={onRemove} />
    </div>
  );
}

// ─── Static row for DragOverlay ───

function StaticWatchlistItemRow({ item }: { item: WatchlistItem }) {
  const quote = useRealtimeQuote(item.symbol);
  const price = quote?.price;
  const change = quote?.change;
  const changePercent = quote?.changePercent;
  const isPositive = (change ?? 0) >= 0;
  const changeColor = change != null
    ? isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'
    : 'text-[#787b86]';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e222d] border border-[#2962ff] rounded shadow-lg">
      <GripVertical className="w-3 h-3 text-[#787b86] shrink-0" />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-xs font-mono font-semibold text-[#d1d4dc] shrink-0 w-16 truncate">
          {item.symbol}
        </span>
        <span className="text-[10px] text-[#787b86] truncate flex-1">
          {item.stockName}
        </span>
      </div>
      <div className="shrink-0 text-right min-w-[100px]">
        {price != null ? (
          <>
            <div className="text-xs font-mono text-[#d1d4dc] leading-tight">
              {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {change != null && changePercent != null ? (
              <div className={`text-[10px] font-mono leading-tight ${changeColor}`}>
                {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
              </div>
            ) : null}
          </>
        ) : (
          <span className="text-[10px] text-[#787b86]">—</span>
        )}
      </div>
    </div>
  );
}

// ─── WatchlistItemContent (shared content) ───

function WatchlistItemContent({
  item,
  groupNo,
  onRemove,
}: {
  item: WatchlistItem;
  groupNo: number;
  onRemove: (groupNo: number, itemNo: number) => void;
}) {
  const quote = useRealtimeQuote(item.symbol);
  const { setSymbol } = useChartStore();

  const price = quote?.price;
  const change = quote?.change;
  const changePercent = quote?.changePercent;

  const isPositive = (change ?? 0) >= 0;
  const changeColor = change != null
    ? isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'
    : 'text-[#787b86]';

  return (
    <>
      {/* Symbol + Name (clickable) */}
      <button
        onClick={() => setSymbol(item.symbol)}
        className="flex-1 min-w-0 flex items-center gap-2 text-left"
      >
        <span className="text-xs font-mono font-semibold text-[#d1d4dc] shrink-0 w-16 truncate">
          {item.symbol}
        </span>
        <span className="text-[10px] text-[#787b86] truncate flex-1">
          {item.stockName}
        </span>
      </button>

      {/* Price data */}
      <div className="shrink-0 text-right min-w-[100px]">
        {price != null ? (
          <>
            <div className="text-xs font-mono text-[#d1d4dc] leading-tight">
              {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {change != null && changePercent != null ? (
              <div className={`text-[10px] font-mono leading-tight ${changeColor}`}>
                {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
              </div>
            ) : null}
          </>
        ) : (
          <span className="text-[10px] text-[#787b86]">—</span>
        )}
      </div>

      {/* Delete button (hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(groupNo, item.userWatchlistItemNo);
        }}
        className="opacity-0 group-hover/item:opacity-100 transition-opacity text-[#787b86] hover:text-[#ef5350] shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </>
  );
}

// ─── Droppable WatchlistGroupSection ───

function WatchlistGroupSection({
  group,
  onRemoveItem,
  onDeleteGroup,
  onRenameGroup,
  onAddSymbol,
  isDropTarget,
  selectedSymbol,
}: {
  group: WatchlistGroup;
  onRemoveItem: (groupNo: number, itemNo: number) => void;
  onDeleteGroup: (groupNo: number) => void;
  onRenameGroup: (groupNo: number, newName: string) => void;
  onAddSymbol: (groupNo: number) => void;
  isDropTarget: boolean;
  selectedSymbol: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameName, setRenameName] = useState(group.groupName);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `group-${group.userWatchlistGroupNo}`,
    data: { groupNo: group.userWatchlistGroupNo },
  });

  const handleRename = () => {
    if (renameName.trim() && renameName.trim() !== group.groupName) {
      onRenameGroup(group.userWatchlistGroupNo, renameName.trim());
    }
    setIsRenaming(false);
  };

  const highlighted = isDropTarget || isOver;

  return (
    <div
      ref={setNodeRef}
      className={`border-b border-[#2a2e39] transition-colors ${
        highlighted ? 'bg-[#2962ff]/10' : ''
      }`}
    >
      {/* Group header */}
      <div className="flex items-center gap-1 px-3 py-1.5 hover:bg-[#1e222d]/50 transition-colors group/header">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#787b86] shrink-0"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>

        {isRenaming ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
              className="h-5 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc] px-1"
              autoFocus
            />
            <button onClick={handleRename} className="text-[#26a69a] hover:text-[#26a69a]/80">
              <Check className="w-3 h-3" />
            </button>
            <button onClick={() => setIsRenaming(false)} className="text-[#787b86] hover:text-[#d1d4dc]">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <span className="text-xs font-medium text-[#d1d4dc] flex-1 min-w-0 truncate">
              {group.groupName}
            </span>
            <span className="text-[10px] text-[#787b86] shrink-0 mr-1">
              {group.items.length}
            </span>
          </>
        )}

        {/* Group actions */}
        {!isRenaming && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onAddSymbol(group.userWatchlistGroupNo); }}
              className="p-0.5 text-[#787b86] hover:text-[#d1d4dc]"
              title="종목 추가"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setRenameName(group.groupName); setIsRenaming(true); }}
              className="p-0.5 text-[#787b86] hover:text-[#d1d4dc]"
              title="이름 변경"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteConfirmOpen(true); }}
              className="p-0.5 text-[#787b86] hover:text-[#ef5350]"
              title="그룹 삭제"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      {expanded && (
        <div>
          {group.items.length === 0 ? (
            <div className="px-3 py-3 text-center text-[10px] text-[#787b86]">
              종목을 추가하세요
            </div>
          ) : (
            group.items.map((item) => (
              <DraggableWatchlistItemRow
                key={item.userWatchlistItemNo}
                item={item}
                groupNo={group.userWatchlistGroupNo}
                onRemove={onRemoveItem}
                isSelected={item.symbol === selectedSymbol}
              />
            ))
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc] sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">그룹 삭제</AlertDialogTitle>
            <AlertDialogDescription className="text-[#787b86] text-xs">
              &apos;{group.groupName}&apos; 그룹과 포함된 종목 {group.items.length}개가 모두 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[#787b86] border-[#2a2e39] hover:bg-[#1e222d] hover:text-[#d1d4dc]">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDeleteGroup(group.userWatchlistGroupNo)}
              className="bg-[#ef5350] hover:bg-[#ef5350]/80 text-white"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── WatchlistPanel (Main) ───

export function WatchlistPanel() {
  const { groups, isLoading, createGroup, updateGroup, deleteGroup, addItem, moveItem, removeItem } = useWatchlist();
  const { symbol } = useChartStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [targetGroupNo, setTargetGroupNo] = useState<number | null>(null);

  // DnD state
  const [activeItem, setActiveItem] = useState<WatchlistItem | null>(null);
  const [activeGroupNo, setActiveGroupNo] = useState<number | null>(null);
  const [overGroupNo, setOverGroupNo] = useState<number | null>(null);

  // Check if current symbol is already in any watchlist group
  const isSymbolInWatchlist = useMemo(() => {
    if (!symbol) return false;
    return groups.some((g) => g.items.some((i) => i.symbol === symbol));
  }, [groups, symbol]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { item, groupNo } = event.active.data.current as { item: WatchlistItem; groupNo: number };
    setActiveItem(item);
    setActiveGroupNo(groupNo);
  }, []);

  const handleDragOver = useCallback((event: { over: { data: { current?: { groupNo?: number } } } | null }) => {
    const overData = event.over?.data?.current;
    if (overData?.groupNo != null) {
      setOverGroupNo(overData.groupNo);
    } else {
      setOverGroupNo(null);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event;

    if (activeItem && activeGroupNo != null && over) {
      const targetData = over.data.current as { groupNo?: number } | undefined;
      const dropGroupNo = targetData?.groupNo;

      if (dropGroupNo != null && dropGroupNo !== activeGroupNo) {
        moveItem(activeGroupNo, dropGroupNo, activeItem.userWatchlistItemNo).catch(() => {
          // error handled in hook
        });
      }
    }

    setActiveItem(null);
    setActiveGroupNo(null);
    setOverGroupNo(null);
  }, [activeItem, activeGroupNo, moveItem]);

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
    setActiveGroupNo(null);
    setOverGroupNo(null);
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await createGroup({ groupName: newGroupName.trim() });
      setNewGroupName('');
      setCreateDialogOpen(false);
    } catch {
      // handled in hook
    }
  };

  const handleAddSymbolToGroup = (groupNo: number) => {
    setTargetGroupNo(groupNo);
    setAddItemDialogOpen(true);
  };

  const handleAddCurrentSymbol = async () => {
    if (!symbol) return;

    // Already in watchlist — show toast
    if (isSymbolInWatchlist) {
      showSuccess(`${symbol}은(는) 이미 왓치리스트에 등록되어 있습니다.`);
      return;
    }

    // Add to first group, or create default group
    let targetGroup = groups[0];
    if (!targetGroup) {
      try {
        targetGroup = await createGroup({ groupName: 'Default' });
      } catch {
        return;
      }
    }
    try {
      await addItem(targetGroup.userWatchlistGroupNo, { symbol });
    } catch {
      // handled in hook
    }
  };

  const handleRenameGroup = async (groupNo: number, newName: string) => {
    try {
      await updateGroup(groupNo, { groupName: newName });
    } catch {
      // handled in hook
    }
  };

  const handleRemoveItem = useCallback((groupNo: number, itemNo: number) => {
    removeItem(groupNo, itemNo).catch(() => {
      // handled in hook
    });
  }, [removeItem]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2e39] flex-shrink-0">
        <h3 className="text-xs font-medium text-[#787b86] uppercase tracking-wider">
          Watchlist
        </h3>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddCurrentSymbol}
            className={`h-6 w-6 p-0 hover:bg-[#2a2e39] ${
              isSymbolInWatchlist
                ? 'text-[#2962ff] hover:text-[#2962ff]'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
            title={isSymbolInWatchlist ? `${symbol} (등록됨)` : `Add ${symbol}`}
          >
            {isSymbolInWatchlist ? (
              <Star className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Star className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setTargetGroupNo(groups[0]?.userWatchlistGroupNo ?? null);
              setAddItemDialogOpen(true);
            }}
            className="h-6 w-6 p-0 text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]"
            title="종목 검색"
          >
            <Search className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            className="h-6 text-[10px] px-2 bg-[#2962ff] hover:bg-[#1e53e5] text-white"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Group
          </Button>
        </div>
      </div>

      {/* Group list with DnD */}
      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-[#1e222d] rounded animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
            <Star className="w-8 h-8 text-[#787b86]/30" />
            <p className="text-xs text-[#787b86]">왓치리스트가 비어있습니다</p>
            <Button
              size="sm"
              className="h-7 text-xs bg-[#2962ff] hover:bg-[#1e53e5] text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              그룹 만들기
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div>
              {groups.map((group) => (
                <WatchlistGroupSection
                  key={group.userWatchlistGroupNo}
                  group={group}
                  onRemoveItem={handleRemoveItem}
                  onDeleteGroup={deleteGroup}
                  onRenameGroup={handleRenameGroup}
                  onAddSymbol={handleAddSymbolToGroup}
                  isDropTarget={overGroupNo === group.userWatchlistGroupNo && overGroupNo !== activeGroupNo}
                  selectedSymbol={symbol}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeItem ? <StaticWatchlistItemRow item={activeItem} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </ScrollArea>

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">새 그룹 만들기</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateGroup(); }}
              placeholder="그룹 이름"
              className="h-8 text-xs bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              className="text-[#787b86]"
            >
              취소
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
              className="bg-[#2962ff] hover:bg-[#1e53e5] text-white"
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <AddWatchlistItemDialog
        open={addItemDialogOpen}
        onOpenChange={setAddItemDialogOpen}
        groups={groups}
        targetGroupNo={targetGroupNo}
        onAdd={addItem}
      />
    </div>
  );
}
