export interface RealtimeQuote {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  timestamp: number;
  type?: 'tick' | 'snapshot';
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
