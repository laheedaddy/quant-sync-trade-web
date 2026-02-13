'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { GetUserStrategyDto } from '@/types/strategy';

interface DeleteStrategyDialogProps {
  strategy: GetUserStrategyDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userStrategyNo: number) => Promise<void>;
}

export function DeleteStrategyDialog({
  strategy,
  open,
  onOpenChange,
  onConfirm,
}: DeleteStrategyDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!strategy) return;
    setLoading(true);
    try {
      await onConfirm(strategy.userStrategyNo);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#131722] border-[#2a2e39] text-[#d1d4dc]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
          <AlertDialogDescription className="text-[#787b86]">
            Are you sure you want to delete <strong className="text-[#d1d4dc]">{strategy?.name}</strong>?
            This action cannot be undone. All indicators and rules will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-[#ef5350] hover:bg-[#d32f2f] text-white"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
