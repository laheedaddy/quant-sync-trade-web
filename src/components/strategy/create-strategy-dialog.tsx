'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import type { CreateStrategyRequest, Timeframe, DeliveryType } from '@/types/strategy';
import { TIMEFRAMES, DELIVERY_TYPES } from '@/types/strategy';

interface CreateStrategyDialogProps {
  onCreate: (body: CreateStrategyRequest) => Promise<unknown>;
  disabled?: boolean;
}

export function CreateStrategyDialog({ onCreate, disabled }: CreateStrategyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [symbolsInput, setSymbolsInput] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('1day');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('NOTIFICATION');
  const [isAutoTrade, setIsAutoTrade] = useState(false);

  function reset() {
    setName('');
    setDescription('');
    setSymbolsInput('');
    setTimeframe('1day');
    setDeliveryType('NOTIFICATION');
    setIsAutoTrade(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const symbols = symbolsInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (!name.trim() || symbols.length === 0) return;

    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        symbols,
        timeframe,
        deliveryType,
        isAutoTrade,
      });
      reset();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          disabled={disabled}
          className="bg-[#2962ff] hover:bg-[#1e53e5] text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Strategy
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc] sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Strategy</DialogTitle>
            <DialogDescription className="text-[#787b86]">
              Define a new trading strategy with indicators and signal rules.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Strategy"
                className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc] resize-none"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="symbols">Symbols * (comma separated)</Label>
              <Input
                id="symbols"
                value={symbolsInput}
                onChange={(e) => setSymbolsInput(e.target.value)}
                placeholder="AAPL, MSFT, TSLA"
                className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Timeframe</Label>
                <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
                  <SelectTrigger className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                    {TIMEFRAMES.map((tf) => (
                      <SelectItem key={tf} value={tf} className="text-[#d1d4dc]">{tf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Delivery</Label>
                <Select value={deliveryType} onValueChange={(v) => setDeliveryType(v as DeliveryType)}>
                  <SelectTrigger className="bg-[#0a0e17] border-[#2a2e39] text-[#d1d4dc]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                    {DELIVERY_TYPES.map((dt) => (
                      <SelectItem key={dt} value={dt} className="text-[#d1d4dc]">{dt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="autoTrade" checked={isAutoTrade} onCheckedChange={setIsAutoTrade} />
              <Label htmlFor="autoTrade">Auto Trade</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-[#787b86]">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || !symbolsInput.trim()}
              className="bg-[#2962ff] hover:bg-[#1e53e5] text-white"
            >
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
