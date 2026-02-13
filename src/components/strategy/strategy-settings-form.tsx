'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  GetUserStrategyDto,
  UpdateStrategyRequest,
  Timeframe,
  DeliveryType,
} from '@/types/strategy';
import { TIMEFRAMES, DELIVERY_TYPES } from '@/types/strategy';

interface StrategySettingsFormProps {
  strategy: GetUserStrategyDto;
  onSave: (body: UpdateStrategyRequest) => Promise<unknown>;
}

export function StrategySettingsForm({ strategy, onSave }: StrategySettingsFormProps) {
  const [name, setName] = useState(strategy.name);
  const [description, setDescription] = useState(strategy.description ?? '');
  const [symbolsInput, setSymbolsInput] = useState(strategy.symbols.join(', '));
  const [timeframe, setTimeframe] = useState<Timeframe>(strategy.timeframe as Timeframe);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(strategy.deliveryType as DeliveryType);
  const [isAutoTrade, setIsAutoTrade] = useState(strategy.isAutoTrade);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const symbols = symbolsInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (!name.trim() || symbols.length === 0) return;

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        symbols,
        timeframe,
        deliveryType,
        isAutoTrade,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid gap-2">
        <Label htmlFor="s-name">Name</Label>
        <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="s-desc">Description</Label>
        <Textarea id="s-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc] resize-none" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="s-symbols">Symbols (comma separated)</Label>
        <Input id="s-symbols" value={symbolsInput} onChange={(e) => setSymbolsInput(e.target.value)} className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Timeframe</Label>
          <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
            <SelectTrigger className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
              {TIMEFRAMES.map((tf) => (<SelectItem key={tf} value={tf} className="text-[#d1d4dc]">{tf}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Delivery</Label>
          <Select value={deliveryType} onValueChange={(v) => setDeliveryType(v as DeliveryType)}>
            <SelectTrigger className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
              {DELIVERY_TYPES.map((dt) => (<SelectItem key={dt} value={dt} className="text-[#d1d4dc]">{dt}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="s-auto" checked={isAutoTrade} onCheckedChange={setIsAutoTrade} />
        <Label htmlFor="s-auto">Auto Trade</Label>
      </div>
      <Button type="submit" disabled={loading || !name.trim() || !symbolsInput.trim()} className="bg-[#2962ff] hover:bg-[#1e53e5] text-white">
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
