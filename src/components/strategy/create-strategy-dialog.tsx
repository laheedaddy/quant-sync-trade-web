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
import { Plus } from 'lucide-react';

interface CreateStrategyDialogProps {
  onCreate: (body: { name: string; description?: string }) => Promise<unknown>;
  disabled?: boolean;
  contextLabel?: string;
}

export function CreateStrategyDialog({ onCreate, disabled, contextLabel }: CreateStrategyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function reset() {
    setName('');
    setDescription('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
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
        <button
          disabled={disabled}
          className="flex items-center gap-0.5 text-[10px] text-[#2962ff] hover:text-[#2962ff]/80 transition-colors disabled:opacity-50"
        >
          <Plus className="w-3 h-3" />
          New Strategy
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc] sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Strategy</DialogTitle>
            <DialogDescription className="text-[#787b86]">
              {contextLabel
                ? `Define a new trading strategy for ${contextLabel}.`
                : 'Define a new trading strategy with indicators and signal rules.'}
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
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-[#787b86]">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
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
