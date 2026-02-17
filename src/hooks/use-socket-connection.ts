'use client';

import { useEffect } from 'react';
import { socketManager } from '@/lib/socket/socket-manager';
import { useQuoteStore } from '@/stores/quote-store';

export function useSocketConnection() {
  const setConnectionStatus = useQuoteStore((s) => s.setConnectionStatus);

  useEffect(() => {
    socketManager.connect();
    const removeListener = socketManager.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    return () => {
      removeListener();
      socketManager.disconnect();
    };
  }, [setConnectionStatus]);
}
