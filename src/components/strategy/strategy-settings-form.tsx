'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
  GetUserStrategyDto,
  UpdateStrategyRequest,
} from '@/types/strategy';

interface StrategySettingsFormProps {
  strategy: GetUserStrategyDto;
  onSave: (body: UpdateStrategyRequest) => Promise<unknown>;
}

export function StrategySettingsForm({ strategy, onSave }: StrategySettingsFormProps) {
  const [name, setName] = useState(strategy.name);
  const [description, setDescription] = useState(strategy.description ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
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
      <Button type="submit" disabled={loading || !name.trim()} className="bg-[#2962ff] hover:bg-[#1e53e5] text-white">
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
