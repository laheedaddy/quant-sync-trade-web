'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { INDICATOR_TYPES } from '@/types/strategy';
import type { IndicatorType, GetUserIndicatorConfigDto } from '@/types/strategy';
import { getIndicatorParamDefs, getDefaultParams, getIndicatorLabel } from '@/lib/strategy/indicator-fields';
import { useChartStore } from '@/stores/chart-store';
import { useDrawingStore } from '@/stores/drawing-store';

// Types excluded from Manual tab (only available via From Chart)
const MANUAL_EXCLUDED_TYPES: IndicatorType[] = ['DRAWING_CHANNEL'];

interface IndicatorConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingIndicator?: GetUserIndicatorConfigDto | null;
  onSubmit: (type: IndicatorType, displayName: string, params: Record<string, number>) => Promise<void>;
}

type FromChartSelection =
  | { source: 'indicator'; configNo: number }
  | { source: 'drawing'; drawingNo: number };

export function IndicatorConfigDialog({ open, onOpenChange, editingIndicator, onSubmit }: IndicatorConfigDialogProps) {
  const isEditing = !!editingIndicator;

  // ── Manual tab state ──
  const [indicatorType, setIndicatorType] = useState<IndicatorType>('RSI');
  const [params, setParams] = useState<Record<string, number>>({});
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  // ── From Chart tab state ──
  const [activeTab, setActiveTab] = useState<string>('from-chart');
  const [chartSelection, setChartSelection] = useState<FromChartSelection | null>(null);
  const [chartDisplayName, setChartDisplayName] = useState('');

  // ── Store access ──
  const { availableConfigs } = useChartStore();
  const { drawings } = useDrawingStore();
  const channelDrawings = drawings.filter((d) => d.drawingType === 'PARALLEL_CHANNEL' && d.points.length >= 3);

  // Manual tab: available types (exclude DRAWING_CHANNEL)
  const manualTypes = INDICATOR_TYPES.filter((t) => !MANUAL_EXCLUDED_TYPES.includes(t));

  // Reset state when dialog opens
  useEffect(() => {
    if (editingIndicator) {
      setIndicatorType(editingIndicator.indicatorType as IndicatorType);
      setParams({ ...editingIndicator.parameters });
      setDisplayName(editingIndicator.displayName);
    } else {
      setActiveTab('from-chart');
      setChartSelection(null);
      setChartDisplayName('');
      setIndicatorType('RSI');
      const defaultParams = getDefaultParams('RSI');
      setParams(defaultParams);
      setDisplayName(getIndicatorLabel('RSI', defaultParams));
    }
  }, [editingIndicator, open]);

  // ── Manual tab handlers ──

  function handleTypeChange(type: IndicatorType) {
    setIndicatorType(type);
    const defaultParams = getDefaultParams(type);
    setParams(defaultParams);
    setDisplayName(getIndicatorLabel(type, defaultParams));
  }

  function handleParamChange(key: string, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const newParams = { ...params, [key]: num };
      setParams(newParams);
      setDisplayName(getIndicatorLabel(indicatorType, newParams));
    }
  }

  // ── From Chart handlers ──

  function handleChartIndicatorSelect(configNo: number) {
    const config = availableConfigs.find((c) => c.userChartIndicatorConfigNo === configNo);
    if (!config) return;
    setChartSelection({ source: 'indicator', configNo });
    setChartDisplayName(config.displayName);
  }

  function handleDrawingSelect(drawingNo: number) {
    setChartSelection({ source: 'drawing', drawingNo });
    setChartDisplayName(`Channel #${drawingNo}`);
  }

  // ── Submit ──

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        // Edit mode: only update displayName
        await onSubmit(
          editingIndicator!.indicatorType as IndicatorType,
          displayName,
          editingIndicator!.parameters,
        );
      } else if (activeTab === 'from-chart' && chartSelection) {
        // From Chart
        if (chartSelection.source === 'indicator') {
          const config = availableConfigs.find(
            (c) => c.userChartIndicatorConfigNo === chartSelection.configNo,
          );
          if (!config) return;
          const numParams: Record<string, number> = {};
          for (const [k, v] of Object.entries(config.parameters)) {
            numParams[k] = Number(v);
          }
          await onSubmit(
            config.indicatorType as IndicatorType,
            chartDisplayName,
            numParams,
          );
        } else {
          // Drawing
          const d = channelDrawings.find(
            (d) => d.userChartDrawingNo === chartSelection.drawingNo,
          );
          if (!d || d.points.length < 3) return;
          const drawingParams: Record<string, number> = {
            userChartDrawingNo: d.userChartDrawingNo,
            p0Time: d.points[0].time,
            p0Price: d.points[0].price,
            p1Time: d.points[1].time,
            p1Price: d.points[1].price,
            p2Time: d.points[2].time,
            p2Price: d.points[2].price,
          };
          await onSubmit('DRAWING_CHANNEL', chartDisplayName, drawingParams);
        }
      } else {
        // Manual
        await onSubmit(indicatorType, displayName, params);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  // ── Derived ──

  const paramDefs = getIndicatorParamDefs(indicatorType);
  const hasChartItems = availableConfigs.length > 0 || channelDrawings.length > 0;

  const canSubmit = isEditing
    ? displayName.trim().length > 0
    : activeTab === 'from-chart'
      ? !!chartSelection && chartDisplayName.trim().length > 0
      : displayName.trim().length > 0;

  // ── Edit mode: simplified view ──

  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc] sm:max-w-sm">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Indicator</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-[#787b86]">Type</Label>
                <div className="text-sm text-[#d1d4dc] px-3 py-2 bg-[#0a0e17] border border-[#2a2e39] rounded">
                  {editingIndicator!.indicatorType}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-[#787b86]">Cancel</Button>
              <Button type="submit" disabled={loading || !canSubmit} className="bg-[#2962ff] hover:bg-[#1e53e5] text-white">
                {loading ? 'Saving...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Add mode: tabbed view ──

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc] sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Indicator</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="w-full bg-[#0a0e17] border border-[#2a2e39]">
              <TabsTrigger
                value="from-chart"
                className="flex-1 text-xs data-[state=active]:bg-[#1e222d] data-[state=active]:text-[#d1d4dc] text-[#787b86]"
              >
                From Chart
              </TabsTrigger>
              <TabsTrigger
                value="manual"
                className="flex-1 text-xs data-[state=active]:bg-[#1e222d] data-[state=active]:text-[#d1d4dc] text-[#787b86]"
              >
                Manual
              </TabsTrigger>
            </TabsList>

            {/* ── From Chart Tab ── */}
            <TabsContent value="from-chart" className="mt-4 space-y-4">
              {!hasChartItems ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-[#787b86]">차트에 추가된 지표가 없습니다.</p>
                  <p className="text-[10px] text-[#787b86] mt-1">
                    차트에 인디케이터나 드로잉을 추가한 후 사용하세요.
                  </p>
                </div>
              ) : (
                <>
                  {/* Chart Indicators */}
                  {availableConfigs.length > 0 && (
                    <div>
                      <p className="text-[10px] text-[#787b86] font-medium mb-1.5 uppercase tracking-wider">
                        Chart Indicators
                      </p>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {availableConfigs.map((config) => {
                          const isSelected =
                            chartSelection?.source === 'indicator' &&
                            chartSelection.configNo === config.userChartIndicatorConfigNo;
                          return (
                            <label
                              key={config.userChartIndicatorConfigNo}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-[#2962ff] bg-[#2962ff]/10'
                                  : 'border-[#2a2e39] bg-[#1e222d] hover:border-[#3a3e49]'
                              }`}
                            >
                              <input
                                type="radio"
                                name="from-chart-selection"
                                checked={isSelected}
                                onChange={() => handleChartIndicatorSelect(config.userChartIndicatorConfigNo)}
                                className="sr-only"
                              />
                              <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#2962ff]' : 'border-[#787b86]'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#2962ff]" />}
                              </div>
                              <span className="text-[10px] text-[#26a69a] font-medium shrink-0">
                                {config.indicatorType}
                              </span>
                              <span className="text-xs text-[#d1d4dc] truncate">
                                {config.displayName}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Drawings */}
                  {channelDrawings.length > 0 && (
                    <div>
                      <p className="text-[10px] text-[#787b86] font-medium mb-1.5 uppercase tracking-wider">
                        Drawings
                      </p>
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {channelDrawings.map((d) => {
                          const isSelected =
                            chartSelection?.source === 'drawing' &&
                            chartSelection.drawingNo === d.userChartDrawingNo;
                          return (
                            <label
                              key={d.userChartDrawingNo}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-[#2962ff] bg-[#2962ff]/10'
                                  : 'border-[#2a2e39] bg-[#1e222d] hover:border-[#3a3e49]'
                              }`}
                            >
                              <input
                                type="radio"
                                name="from-chart-selection"
                                checked={isSelected}
                                onChange={() => handleDrawingSelect(d.userChartDrawingNo)}
                                className="sr-only"
                              />
                              <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#2962ff]' : 'border-[#787b86]'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#2962ff]" />}
                              </div>
                              <span className="text-[10px] text-[#ff9800] font-medium shrink-0">
                                CHANNEL
                              </span>
                              <span className="text-xs text-[#d1d4dc]">
                                Channel #{d.userChartDrawingNo}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Display Name (only when something is selected) */}
                  {chartSelection && (
                    <div className="grid gap-2">
                      <Label>Display Name</Label>
                      <Input
                        value={chartDisplayName}
                        onChange={(e) => setChartDisplayName(e.target.value)}
                        className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
                      />
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* ── Manual Tab ── */}
            <TabsContent value="manual" className="mt-4 space-y-4">
              <div className="grid gap-2">
                <Label>Indicator Type</Label>
                <Select value={indicatorType} onValueChange={(v) => handleTypeChange(v as IndicatorType)}>
                  <SelectTrigger className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                    {manualTypes.map((t) => (
                      <SelectItem key={t} value={t} className="text-[#d1d4dc]">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
                />
              </div>

              {paramDefs.map((def) => (
                <div key={def.key} className="grid gap-2">
                  <Label>{def.label}</Label>
                  <Input
                    type="number"
                    value={params[def.key] ?? def.defaultValue}
                    onChange={(e) => handleParamChange(def.key, e.target.value)}
                    min={def.min}
                    max={def.max}
                    step={def.key === 'deviation' ? 0.1 : 1}
                    className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-[#787b86]">Cancel</Button>
            <Button type="submit" disabled={loading || !canSubmit} className="bg-[#2962ff] hover:bg-[#1e53e5] text-white">
              {loading ? 'Saving...' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
