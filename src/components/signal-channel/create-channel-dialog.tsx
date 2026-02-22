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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchVersions } from '@/lib/api/strategy-version';
import { useSignalChannels } from '@/hooks/use-signal-channels';
import type { GetUserStrategyVersionDto, DeliveryMethod } from '@/types/strategy';
import { DELIVERY_METHODS } from '@/types/strategy';
import type { DeliveryMethodConfig, WebhookConfig } from '@/types/signal-channel';
import { fetchWebhookConfigs } from '@/lib/api/webhook-config';
import { showError } from '@/lib/toast';

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  NOTIFICATION: 'Notification (알림)',
  WEBHOOK: 'Webhook (웹훅)',
  LOCAL_CLIENT: 'Local Client (전용 클라이언트)',
};

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
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookConfig[]>([]);
  const [selectedVersionNo, setSelectedVersionNo] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMethods, setSelectedMethods] = useState<Set<DeliveryMethod>>(new Set(['NOTIFICATION']));
  const [selectedWebhookNo, setSelectedWebhookNo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Load versions and webhook configs when dialog opens
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      try {
        const [versionList, webhookList] = await Promise.all([
          fetchVersions(strategyNo, 'MAJOR'),
          fetchWebhookConfigs(),
        ]);
        setVersions(versionList);
        setWebhookConfigs(webhookList);
      } catch (err) {
        showError(err);
      }
    };

    loadData();
    setSelectedVersionNo('');
    setTitle('');
    setDescription('');
    setSelectedMethods(new Set(['NOTIFICATION']));
    setSelectedWebhookNo('');
  }, [open, strategyNo]);

  const toggleMethod = (method: DeliveryMethod) => {
    setSelectedMethods((prev) => {
      const next = new Set(prev);
      if (next.has(method)) {
        next.delete(method);
      } else {
        next.add(method);
      }
      return next;
    });
  };

  const buildDeliveryMethods = (): DeliveryMethodConfig[] => {
    const methods: DeliveryMethodConfig[] = [];
    for (const method of selectedMethods) {
      if (method === 'WEBHOOK') {
        if (selectedWebhookNo) {
          methods.push({ method: 'WEBHOOK', webhookConfigNo: Number(selectedWebhookNo) });
        }
      } else {
        methods.push({ method });
      }
    }
    return methods.length > 0 ? methods : [{ method: 'NOTIFICATION' }];
  };

  const handleCreate = async () => {
    if (!selectedVersionNo || !title.trim()) return;

    setIsLoading(true);
    try {
      const deliveryMethods = buildDeliveryMethods();
      await create({
        userStrategyVersionNo: Number(selectedVersionNo),
        title: title.trim(),
        description: description.trim() || undefined,
        symbol,
        timeframe,
        deliveryType: 'NOTIFICATION',
        isAutoTrade: false,
        deliveryMethods,
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

          {/* Delivery Methods (multi-select checkboxes) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#787b86]">Delivery Methods</Label>
            <div className="space-y-2 px-1">
              {DELIVERY_METHODS.map((method) => (
                <div key={method} className="flex items-center gap-2">
                  <Checkbox
                    id={`method-${method}`}
                    checked={selectedMethods.has(method)}
                    onCheckedChange={() => toggleMethod(method)}
                    className="border-[#2a2e39] data-[state=checked]:bg-[#2962ff] data-[state=checked]:border-[#2962ff]"
                  />
                  <label
                    htmlFor={`method-${method}`}
                    className="text-xs text-[#d1d4dc] cursor-pointer"
                  >
                    {DELIVERY_METHOD_LABELS[method]}
                  </label>
                </div>
              ))}
            </div>

            {/* Webhook config selector (visible when WEBHOOK is checked) */}
            {selectedMethods.has('WEBHOOK') && (
              <div className="ml-6 mt-1.5">
                <Select value={selectedWebhookNo} onValueChange={setSelectedWebhookNo}>
                  <SelectTrigger className="h-7 text-xs bg-[#131722] border-[#2a2e39]">
                    <SelectValue placeholder="Select webhook config" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                    {webhookConfigs.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No webhook configs — create one first
                      </SelectItem>
                    ) : (
                      webhookConfigs.map((wc) => (
                        <SelectItem
                          key={wc.webhookConfigNo}
                          value={String(wc.webhookConfigNo)}
                          className="text-xs text-[#d1d4dc]"
                        >
                          {wc.name} ({wc.url})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
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
