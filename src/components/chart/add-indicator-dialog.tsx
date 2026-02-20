'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { INDICATOR_TYPES } from '@/types/strategy';
import type { IndicatorType } from '@/types/strategy';
import type { UserChartIndicatorConfig } from '@/types/chart';
import { getIndicatorParamDefs, getDefaultParams, getIndicatorLabel } from '@/lib/strategy/indicator-fields';
import { getIndicatorSeriesConfig } from '@/lib/chart/indicators';
import type { IndicatorType as ChartIndicatorType } from '@/types/chart';
import { RotateCcw } from 'lucide-react';

const LINE_WIDTH_OPTIONS = [1, 2, 3, 4];

interface AddIndicatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (indicatorType: string, displayName: string, parameters: Record<string, number>, colors?: Record<string, string> | null, lineWidths?: Record<string, number> | null) => Promise<void>;
  /** When set, dialog operates in edit mode */
  editingConfig?: UserChartIndicatorConfig | null;
  onUpdate?: (configNo: number, displayName: string, parameters: Record<string, number>, colors?: Record<string, string> | null, lineWidths?: Record<string, number> | null) => Promise<void>;
}

export function AddIndicatorDialog({ open, onOpenChange, onSubmit, editingConfig, onUpdate }: AddIndicatorDialogProps) {
  const isEditing = !!editingConfig;

  const [indicatorType, setIndicatorType] = useState<IndicatorType>('RSI');
  const [params, setParams] = useState<Record<string, number>>({});
  const [displayName, setDisplayName] = useState('');
  const [colors, setColors] = useState<Record<string, string>>({});
  const [lineWidths, setLineWidths] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Get series keys + default colors for current indicator type
  const seriesConfig = useMemo(() => {
    return getIndicatorSeriesConfig(indicatorType as ChartIndicatorType);
  }, [indicatorType]);

  useEffect(() => {
    if (!open) return;
    if (editingConfig) {
      setIndicatorType(editingConfig.indicatorType as IndicatorType);
      const numParams: Record<string, number> = {};
      for (const [k, v] of Object.entries(editingConfig.parameters)) {
        numParams[k] = Number(v);
      }
      setParams(numParams);
      setDisplayName(editingConfig.displayName);
      setColors(editingConfig.colors ?? {});
      setLineWidths(editingConfig.lineWidths ?? {});
    } else {
      setIndicatorType('RSI');
      const defaultParams = getDefaultParams('RSI');
      setParams(defaultParams);
      setDisplayName(getIndicatorLabel('RSI', defaultParams));
      setColors({});
      setLineWidths({});
    }
  }, [open, editingConfig]);

  function handleTypeChange(type: IndicatorType) {
    setIndicatorType(type);
    const defaultParams = getDefaultParams(type);
    setParams(defaultParams);
    setDisplayName(getIndicatorLabel(type, defaultParams));
    setColors({});
    setLineWidths({});
  }

  function handleParamChange(key: string, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const newParams = { ...params, [key]: num };
      setParams(newParams);
      setDisplayName(getIndicatorLabel(indicatorType, newParams));
    }
  }

  function handleColorChange(key: string, color: string) {
    setColors((prev) => ({ ...prev, [key]: color }));
  }

  function handleLineWidthChange(key: string, width: number) {
    setLineWidths((prev) => ({ ...prev, [key]: width }));
  }

  function handleResetStyle() {
    setColors({});
    setLineWidths({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const colorsToSave = Object.keys(colors).length > 0 ? colors : null;
      const lineWidthsToSave = Object.keys(lineWidths).length > 0 ? lineWidths : null;
      if (isEditing && onUpdate) {
        await onUpdate(editingConfig!.userChartIndicatorConfigNo, displayName, params, colorsToSave, lineWidthsToSave);
      } else {
        await onSubmit(indicatorType, displayName, params, colorsToSave, lineWidthsToSave);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  const paramDefs = getIndicatorParamDefs(indicatorType);
  const lineSeries = seriesConfig.series.filter((s) => s.seriesType === 'line');
  const hasCustomStyle = Object.keys(colors).length > 0 || Object.keys(lineWidths).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc] sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Indicator' : 'Add Indicator'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Indicator Type</Label>
              <Select value={indicatorType} onValueChange={(v) => handleTypeChange(v as IndicatorType)} disabled={isEditing}>
                <SelectTrigger className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                  {INDICATOR_TYPES.filter((t) => t !== 'DRAWING_CHANNEL').map((t) => (<SelectItem key={t} value={t} className="text-[#d1d4dc]">{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]" />
            </div>
            {paramDefs.map((def) => (
              <div key={def.key} className="grid gap-2">
                <Label>{def.label}</Label>
                <Input type="number" value={params[def.key] ?? def.defaultValue} onChange={(e) => handleParamChange(def.key, e.target.value)} min={def.min} max={def.max} step={def.key === 'deviation' ? 0.1 : 1} className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]" />
              </div>
            ))}

            {/* Style Section: Color + Line Width per series */}
            {lineSeries.length > 0 && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Style</Label>
                  {hasCustomStyle && (
                    <button
                      type="button"
                      onClick={handleResetStyle}
                      className="flex items-center gap-1 text-[10px] text-[#787b86] hover:text-[#d1d4dc] transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {lineSeries.map((s) => (
                    <div key={s.key} className="flex items-center gap-3">
                      {/* Series label */}
                      <label className="text-xs text-[#787b86] min-w-[40px]">{s.key}</label>
                      {/* Color picker */}
                      <div className="relative">
                        <div
                          className="w-6 h-6 rounded-full border border-[#2a2e39] cursor-pointer"
                          style={{ backgroundColor: colors[s.key] ?? s.color }}
                        />
                        <input
                          type="color"
                          value={colors[s.key] ?? s.color}
                          onChange={(e) => handleColorChange(s.key, e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      {/* Line width selector */}
                      <div className="flex items-center gap-1">
                        {LINE_WIDTH_OPTIONS.map((w) => {
                          const currentWidth = lineWidths[s.key] ?? s.lineWidth ?? 1;
                          const isSelected = currentWidth === w;
                          return (
                            <button
                              key={w}
                              type="button"
                              onClick={() => handleLineWidthChange(s.key, w)}
                              className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${
                                isSelected
                                  ? 'border-[#2962ff] bg-[#2962ff]/20'
                                  : 'border-[#2a2e39] hover:border-[#787b86]'
                              }`}
                              title={`Width ${w}`}
                            >
                              <div
                                className="rounded-full"
                                style={{
                                  width: '16px',
                                  height: `${w}px`,
                                  backgroundColor: colors[s.key] ?? s.color,
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-[#787b86]">Cancel</Button>
            <Button type="submit" disabled={loading || !displayName.trim()} className="bg-[#2962ff] hover:bg-[#1e53e5] text-white">
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
