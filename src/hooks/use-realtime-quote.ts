'use client';

import { useEffect } from 'react';
import { socketManager } from '@/lib/socket/socket-manager';
import { useQuoteStore } from '@/stores/quote-store';

export function useRealtimeQuote(symbol: string | null) {
  const quote = useQuoteStore((s) => (symbol ? s.quotes[symbol] : undefined));
  const setQuote = useQuoteStore((s) => s.setQuote);

  useEffect(() => {
    if (!symbol) return;

    socketManager.subscribeQuote(symbol);
    const removeListener = socketManager.onQuote(symbol, (data) => {
      setQuote(data);
    });

    return () => {
      removeListener();
      socketManager.unsubscribeQuote(symbol);
    };
  }, [symbol, setQuote]);

  return quote ?? null;
}
