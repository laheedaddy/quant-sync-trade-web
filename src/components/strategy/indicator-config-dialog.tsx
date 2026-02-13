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
import { INDICATOR_TYPES } from '@/types/strategy';
import type { IndicatorType, GetUserIndicatorConfigDto } from '@/types/strategy';
import { getIndicatorParamDefs, getDefaultParams, getIndicatorLabel } from '@/lib/strategy/indicator-fields';

interface IndicatorConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingIndicator?: GetUserIndicatorConfigDto | null;
  onSubmit: (type: IndicatorType, displayName: string, params: Record<string, number>) => Promise<void>;
}

export function IndicatorConfigDialog({ open, onOpenChange, editingIndicator, onSubmit }: IndicatorConfigDialogProps) {
  const [indicatorType, setIndicatorType] = useState<IndicatorType>('RSI');
  const [params, setParams] = useState<Record<string, number>>({});
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const isEditing = !!editingIndicator;

  useEffect(() => {
    if (editingIndicator) {
      setIndicatorType(editingIndicator.indicatorType as IndicatorType);
      setParams({ ...editingIndicator.parameters });
      setDisplayName(editingIndicator.displayName);
    } else {
      setIndicatorType('RSI');
      const defaultParams = getDefaultParams('RSI');
      setParams(defaultParams);
      setDisplayName(getIndicatorLabel('RSI', defaultParams));
    }
  }, [editingIndicator, open]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(indicatorType, displayName, params);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  const paramDefs = getIndicatorParamDefs(indicatorType);

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
                  {INDICATOR_TYPES.map((t) => (<SelectItem key={t} value={t} className="text-[#d1d4dc]">{t}</SelectItem>))}
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
