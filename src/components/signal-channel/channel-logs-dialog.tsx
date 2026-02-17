'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useSignalChannels } from '@/hooks/use-signal-channels';

interface ChannelLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategyNo: number;
  channelNo: number;
}

export function ChannelLogsDialog({
  open,
  onOpenChange,
  strategyNo,
  channelNo,
}: ChannelLogsDialogProps) {
  const { channelLogs, isLoadingLogs, loadLogs } = useSignalChannels(strategyNo);

  useEffect(() => {
    if (open && channelNo) {
      loadLogs(channelNo, 1, 50);
    }
  }, [open, channelNo, loadLogs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc] max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-sm">Signal Logs</DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[60vh]">
          {isLoadingLogs ? (
            <div className="space-y-2">
              <Skeleton className="h-8 bg-[#131722]" />
              <Skeleton className="h-8 bg-[#131722]" />
              <Skeleton className="h-8 bg-[#131722]" />
            </div>
          ) : channelLogs.length === 0 ? (
            <div className="p-8 text-center text-[#787b86] text-sm">
              No signal logs yet.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2a2e39] text-[#787b86]">
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-right py-2 px-2">Price</th>
                  <th className="text-left py-2 px-2">Rule</th>
                  <th className="text-right py-2 px-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {channelLogs.map((log) => (
                  <tr
                    key={log.signalChannelLogNo}
                    className="border-b border-[#2a2e39]/50 hover:bg-[#131722]/50"
                  >
                    <td className="py-2 px-2">
                      <span
                        className={`font-medium ${
                          log.signalType === 'BUY' ? 'text-[#26a69a]' : 'text-[#ef5350]'
                        }`}
                      >
                        {log.signalType}
                      </span>
                    </td>
                    <td className="text-right py-2 px-2 text-[#d1d4dc]">
                      ${Number(log.price).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      })}
                    </td>
                    <td className="py-2 px-2 text-[#787b86]">
                      {log.matchedRuleType}
                    </td>
                    <td className="text-right py-2 px-2 text-[#787b86]">
                      {new Date(log.evaluatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
