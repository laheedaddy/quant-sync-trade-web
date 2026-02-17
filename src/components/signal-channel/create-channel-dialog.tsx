'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchVersions } from '@/lib/api/strategy-version';
import { useSignalChannels } from '@/hooks/use-signal-channels';
import type { GetUserStrategyVersionDto } from '@/types/strategy';
import type { DeliveryType } from '@/types/strategy';
import { DELIVERY_TYPES } from '@/types/strategy';
import { showError } from '@/lib/toast';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategyNo: number;
  symbol: string;
  timeframe: string;
  onCreated: () => void;
}

export function CreateChannelDialog({
  open,
  onOpenChange,
  strategyNo,
  symbol,
  timeframe,
  onCreated,
}: CreateChannelDialogProps) {
  const { create } = useSignalChannels(strategyNo);

  const [versions, setVersions] = useState<GetUserStrategyVersionDto[]>([]);
  const [selectedVersionNo, setSelectedVersionNo] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('NOTIFICATION');
  const [isAutoTrade, setIsAutoTrade] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load versions when dialog opens
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      try {
        const versionList = await fetchVersions(strategyNo, 'MAJOR');
        setVersions(versionList);
      } catch (err) {
        showError(err);
      }
    };

    loadData();
    setSelectedVersionNo('');
    setTitle('');
    setDescription('');
    setDeliveryType('NOTIFICATION');
    setIsAutoTrade(false);
  }, [open, strategyNo]);

  const handleCreate = async () => {
    if (!selectedVersionNo || !title.trim()) return;

    setIsLoading(true);
    try {
      await create({
        userStrategyVersionNo: Number(selectedVersionNo),
        title: title.trim(),
        description: description.trim() || undefined,
        symbol,
        timeframe,
        deliveryType,
        isAutoTrade,
      });
      onOpenChange(false);
      onCreated();
    } catch {
      // Error shown by hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc] max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">New Signal Channel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Strategy context info */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#131722] border border-[#2a2e39]">
            <span className="text-[11px] font-mono text-[#d1d4dc]">{symbol}</span>
            <span className="text-[10px] text-[#787b86]">·</span>
            <span className="text-[11px] font-mono text-[#787b86]">{timeframe}</span>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#787b86]">제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="채널 제목"
              className="h-8 text-xs bg-[#131722] border-[#2a2e39] text-[#d1d4dc]"
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#787b86]">설명 (선택)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="채널 설명..."
              rows={2}
              className="w-full px-2 py-1.5 text-xs bg-[#131722] border border-[#2a2e39] rounded text-[#d1d4dc] resize-none focus:outline-none focus:border-[#2962ff]"
            />
          </div>

          {/* Version Select */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#787b86]">Version (MAJOR only)</Label>
            <Select value={selectedVersionNo} onValueChange={setSelectedVersionNo}>
              <SelectTrigger className="h-8 text-xs bg-[#131722] border-[#2a2e39]">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                {versions.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No MAJOR versions available
                  </SelectItem>
                ) : (
                  versions.map((v) => (
                    <SelectItem
                      key={v.userStrategyVersionNo}
                      value={String(v.userStrategyVersionNo)}
                      className="text-xs text-[#d1d4dc]"
                    >
                      v{v.versionNumber} - {v.description || 'No description'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Type Select */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#787b86]">Delivery Type</Label>
            <Select value={deliveryType} onValueChange={(v) => setDeliveryType(v as DeliveryType)}>
              <SelectTrigger className="h-8 text-xs bg-[#131722] border-[#2a2e39]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                {DELIVERY_TYPES.map((dt) => (
                  <SelectItem key={dt} value={dt} className="text-xs text-[#d1d4dc]">
                    {dt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto Trade Switch */}
          <div className="flex items-center gap-3">
            <Switch id="ch-auto" checked={isAutoTrade} onCheckedChange={setIsAutoTrade} />
            <Label htmlFor="ch-auto" className="text-xs text-[#787b86]">Auto Trade</Label>
          </div>

          {/* Create Button */}
          <Button
            className="w-full h-8 text-xs bg-[#2962ff] hover:bg-[#1e53e5] text-white"
            disabled={!selectedVersionNo || !title.trim() || isLoading}
            onClick={handleCreate}
          >
            {isLoading ? 'Creating...' : 'Create Channel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
