'use client';

import { useEffect, useState, useMemo } from 'react';
import { useBacktest } from '@/hooks/use-backtest';
import { useStrategyVersions } from '@/hooks/use-strategy-versions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Info, RotateCcw, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { GetUserStrategyVersionDto } from '@/types/strategy';

interface VersionGroup {
  major: GetUserStrategyVersionDto | null; // null = Draft group
  minors: GetUserStrategyVersionDto[];
}

function buildVersionTree(versions: GetUserStrategyVersionDto[]): VersionGroup[] {
  const sorted = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
  const groups: VersionGroup[] = [];
  let currentGroup: VersionGroup = { major: null, minors: [] };

  for (const v of sorted) {
    if (v.versionType === 'MAJOR') {
      // Push previous group if it has content
      if (currentGroup.major !== null || currentGroup.minors.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = { major: v, minors: [] };
    } else {
      currentGroup.minors.push(v);
    }
  }

  // Push the last group
  if (currentGroup.major !== null || currentGroup.minors.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

export function VersionTab() {
  const { selectedStrategyNo } = useBacktest();
  const {
    versions,
    selectedVersionNo,
    setSelectedVersionNo,
    loadVersions,
    handleCreateVersion,
    handleDeleteVersion,
    handleRestoreVersion,
  } = useStrategyVersions();

  const [isLoading, setIsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [expandedInfo, setExpandedInfo] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (selectedStrategyNo) {
      setIsLoading(true);
      loadVersions(selectedStrategyNo).finally(() => setIsLoading(false));
    }
  }, [selectedStrategyNo, loadVersions]);

  const versionTree = useMemo(() => buildVersionTree(versions), [versions]);

  if (!selectedStrategyNo) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-[#787b86]">Select a strategy first.</p>
      </div>
    );
  }

  const onCreateVersion = async () => {
    if (!selectedStrategyNo) return;
    try {
      await handleCreateVersion(selectedStrategyNo, { description: description || undefined });
      setCreateOpen(false);
      setDescription('');
    } catch {
      // error handled in hook
    }
  };

  const onDelete = async (versionNo: number) => {
    if (!selectedStrategyNo) return;
    await handleDeleteVersion(selectedStrategyNo, versionNo);
  };

  const onRestore = async (versionNo: number) => {
    if (!selectedStrategyNo) return;
    await handleRestoreVersion(selectedStrategyNo, versionNo);
  };

  const toggleGroupCollapse = (majorVersionNo: number) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(majorVersionNo)) {
        next.delete(majorVersionNo);
      } else {
        next.add(majorVersionNo);
      }
      return next;
    });
  };

  const handleVersionClick = (versionNo: number) => {
    setSelectedVersionNo(selectedVersionNo === versionNo ? null : versionNo);
  };

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-medium text-[#d1d4dc]">Version Management</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="h-6 text-[10px] bg-[#2962ff] hover:bg-[#1e53e4] text-white"
            >
              <Plus className="w-3 h-3 mr-1" />
              Create Version
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
            <DialogHeader>
              <DialogTitle className="text-sm">Save current strategy state as version</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#787b86]">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes about this version..."
                  className="mt-1 w-full h-20 px-2 py-1.5 text-xs bg-[#131722] border border-[#2a2e39] rounded text-[#d1d4dc] resize-none focus:outline-none focus:border-[#2962ff]"
                />
              </div>
              <Button
                onClick={onCreateVersion}
                className="w-full h-8 text-xs bg-[#2962ff] hover:bg-[#1e53e4] text-white"
              >
                Create Version
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-[#1e222d]" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && versions.length === 0 && (
        <div className="p-4 text-center">
          <p className="text-sm text-[#787b86]">No versions created.</p>
          <p className="text-[10px] text-[#787b86] mt-1">
            Creating a version saves the current strategy state as a snapshot.
          </p>
        </div>
      )}

      {/* Version tree */}
      {!isLoading && versionTree.length > 0 && (
        <div className="space-y-1">
          {versionTree.map((group, groupIdx) => (
            <VersionGroupNode
              key={group.major?.userStrategyVersionNo ?? `draft-${groupIdx}`}
              group={group}
              selectedVersionNo={selectedVersionNo}
              isCollapsed={
                group.major
                  ? collapsedGroups.has(group.major.userStrategyVersionNo)
                  : false
              }
              expandedInfo={expandedInfo}
              onToggleCollapse={() =>
                group.major && toggleGroupCollapse(group.major.userStrategyVersionNo)
              }
              onToggleInfo={(no) =>
                setExpandedInfo(expandedInfo === no ? null : no)
              }
              onSelect={handleVersionClick}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Version Group Node ───

interface VersionGroupNodeProps {
  group: VersionGroup;
  selectedVersionNo: number | null;
  isCollapsed: boolean;
  expandedInfo: number | null;
  onToggleCollapse: () => void;
  onToggleInfo: (no: number) => void;
  onSelect: (no: number) => void;
  onDelete: (no: number) => void;
  onRestore: (no: number) => void;
}

function VersionGroupNode({
  group,
  selectedVersionNo,
  isCollapsed,
  expandedInfo,
  onToggleCollapse,
  onToggleInfo,
  onSelect,
  onDelete,
  onRestore,
}: VersionGroupNodeProps) {
  const isDraft = group.major === null;

  return (
    <div>
      {/* Major header or Draft header */}
      {isDraft ? (
        <div className="px-2 py-1.5">
          <span className="text-[10px] font-medium text-[#787b86] uppercase tracking-wider">
            Draft
          </span>
        </div>
      ) : (
        <MajorVersionRow
          version={group.major!}
          minorCount={group.minors.length}
          isCollapsed={isCollapsed}
          isSelected={selectedVersionNo === group.major!.userStrategyVersionNo}
          isInfoExpanded={expandedInfo === group.major!.userStrategyVersionNo}
          onToggleCollapse={onToggleCollapse}
          onToggleInfo={() => onToggleInfo(group.major!.userStrategyVersionNo)}
          onSelect={() => onSelect(group.major!.userStrategyVersionNo)}
          onDelete={() => onDelete(group.major!.userStrategyVersionNo)}
          onRestore={() => onRestore(group.major!.userStrategyVersionNo)}
        />
      )}

      {/* Minor children */}
      {!isCollapsed &&
        group.minors.map((minor) => (
          <MinorVersionRow
            key={minor.userStrategyVersionNo}
            version={minor}
            isSelected={selectedVersionNo === minor.userStrategyVersionNo}
            isInfoExpanded={expandedInfo === minor.userStrategyVersionNo}
            onToggleInfo={() => onToggleInfo(minor.userStrategyVersionNo)}
            onSelect={() => onSelect(minor.userStrategyVersionNo)}
            onDelete={() => onDelete(minor.userStrategyVersionNo)}
          />
        ))}
    </div>
  );
}

// ─── Major Version Row ───

interface MajorVersionRowProps {
  version: GetUserStrategyVersionDto;
  minorCount: number;
  isCollapsed: boolean;
  isSelected: boolean;
  isInfoExpanded: boolean;
  onToggleCollapse: () => void;
  onToggleInfo: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onRestore: () => void;
}

function MajorVersionRow({
  version,
  minorCount,
  isCollapsed,
  isSelected,
  isInfoExpanded,
  onToggleCollapse,
  onToggleInfo,
  onSelect,
  onDelete,
  onRestore,
}: MajorVersionRowProps) {
  const { snapshot } = version;

  return (
    <div
      className={`rounded border overflow-hidden ${
        isSelected
          ? 'border-[#2962ff]/60 bg-[#2962ff]/10'
          : 'border-[#2a2e39] bg-[#1e222d]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            onClick={onToggleCollapse}
            className="p-0.5 text-[#787b86] hover:text-[#d1d4dc] transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onSelect}
            className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
          >
            <span className="text-xs font-mono font-medium text-[#2962ff]">
              v{version.versionNumber}
            </span>
            <span className="text-[10px] text-[#787b86] truncate">
              {version.description || 'MAJOR'}
            </span>
            <Badge
              variant="outline"
              className="text-[9px] h-4 border-[#2a2e39] text-[#787b86] shrink-0"
            >
              {minorCount} minor
            </Badge>
          </button>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[9px] text-[#787b86] mr-1">
            {new Date(version.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
          </span>
          <button
            onClick={onToggleInfo}
            className="p-1 text-[#787b86] hover:text-[#d1d4dc] transition-colors"
            title="Details"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="p-1 text-[#787b86] hover:text-[#2962ff] transition-colors"
                title="Restore to this version"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm">
                  Restore v{version.versionNumber}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-[#787b86]">
                  Current strategy indicators and rules will be replaced with this
                  version&apos;s snapshot. Current settings will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs bg-[#2a2e39] border-[#2a2e39] text-[#d1d4dc] hover:bg-[#363a45]">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onRestore}
                  className="text-xs bg-[#2962ff] hover:bg-[#1e53e4] text-white"
                >
                  Restore
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="p-1 text-[#787b86] hover:text-[#ef5350] transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm">
                  Delete v{version.versionNumber}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-[#787b86]">
                  Are you sure you want to delete this version? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs bg-[#2a2e39] border-[#2a2e39] text-[#d1d4dc] hover:bg-[#363a45]">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="text-xs bg-[#ef5350] hover:bg-[#d32f2f] text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info expanded */}
      {isInfoExpanded && (
        <div className="border-t border-[#2a2e39] p-2.5 space-y-2">
          <div>
            <p className="text-[10px] text-[#787b86]">Strategy: {snapshot.strategyName}</p>
          </div>
          <Separator className="bg-[#2a2e39]" />
          <div>
            <p className="text-[10px] text-[#787b86] mb-1">Indicators ({snapshot.indicators.length})</p>
            <div className="flex flex-wrap gap-1">
              {snapshot.indicators.map((ind, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#2a2e39] text-[#d1d4dc]"
                >
                  <span className="text-[#26a69a] font-medium">{ind.indicatorType}</span>
                  {ind.displayName}
                </span>
              ))}
              {snapshot.indicators.length === 0 && (
                <span className="text-[10px] text-[#787b86]">None</span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-[#787b86]">
            BUY rules: {snapshot.buyRules.length} / SELL rules: {snapshot.sellRules.length}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Minor Version Row ───

interface MinorVersionRowProps {
  version: GetUserStrategyVersionDto;
  isSelected: boolean;
  isInfoExpanded: boolean;
  onToggleInfo: () => void;
  onSelect: () => void;
  onDelete: () => void;
}

function MinorVersionRow({
  version,
  isSelected,
  isInfoExpanded,
  onToggleInfo,
  onSelect,
  onDelete,
}: MinorVersionRowProps) {
  const { snapshot } = version;

  return (
    <div
      className={`ml-5 rounded border overflow-hidden ${
        isSelected
          ? 'border-[#ff9800]/60 bg-[#ff9800]/10'
          : 'border-[#2a2e39]/60 bg-[#1e222d]/70'
      }`}
    >
      <div className="flex items-center justify-between px-2 py-1.5">
        <button
          onClick={onSelect}
          className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
        >
          <span className="text-[10px] font-mono font-medium text-[#ff9800]">
            d{version.versionNumber}
          </span>
          <span className="text-[10px] text-[#787b86] truncate">
            {version.description || 'Auto'}
          </span>
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[9px] text-[#787b86] mr-1">
            {new Date(version.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
          </span>
          <button
            onClick={onToggleInfo}
            className="p-0.5 text-[#787b86] hover:text-[#d1d4dc] transition-colors"
            title="Details"
          >
            <Info className="w-3 h-3" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="p-0.5 text-[#787b86] hover:text-[#ef5350] transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm">
                  Delete d{version.versionNumber}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-[#787b86]">
                  Are you sure you want to delete this minor version? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs bg-[#2a2e39] border-[#2a2e39] text-[#d1d4dc] hover:bg-[#363a45]">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="text-xs bg-[#ef5350] hover:bg-[#d32f2f] text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info expanded */}
      {isInfoExpanded && (
        <div className="border-t border-[#2a2e39]/60 p-2 space-y-1.5">
          <div className="text-[10px] text-[#787b86]">
            {snapshot.strategyName}
          </div>
          <div className="flex flex-wrap gap-1">
            {snapshot.indicators.map((ind, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] bg-[#2a2e39] text-[#d1d4dc]"
              >
                <span className="text-[#26a69a]">{ind.indicatorType}</span>
                {ind.displayName}
              </span>
            ))}
          </div>
          <div className="text-[9px] text-[#787b86]">
            {snapshot.buyRules.length}B / {snapshot.sellRules.length}S rules
          </div>
        </div>
      )}
    </div>
  );
}
