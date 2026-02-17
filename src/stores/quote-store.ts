import { create } from 'zustand';
import type { RealtimeQuote, ConnectionStatus } from '@/types/quote';

interface QuoteState {
  quotes: Record<string, RealtimeQuote>;
  connectionStatus: ConnectionStatus;
  setQuote: (quote: RealtimeQuote) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

export const useQuoteStore = create<QuoteState>((set) => ({
  quotes: {},
  connectionStatus: 'disconnected',

  setQuote: (quote) =>
    set((state) => ({
      quotes: { ...state.quotes, [quote.symbol]: quote },
    })),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
}));
