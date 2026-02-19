import { io, Socket } from 'socket.io-client';
import type { RealtimeQuote, ConnectionStatus } from '@/types/quote';

type QuoteListener = (quote: RealtimeQuote) => void;
type StatusListener = (status: ConnectionStatus) => void;

class SocketManager {
  private socket: Socket | null = null;
  private quoteListeners = new Map<string, Set<QuoteListener>>();
  private statusListeners = new Set<StatusListener>();
  /** Reference-counted subscriptions: symbol → subscriber count */
  private symbolRefCount = new Map<string, number>();

  connect() {
    if (this.socket?.connected) return;

    const url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:6001';
    this.notifyStatus('connecting');

    this.socket = io(`${url}/ws`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      this.notifyStatus('connected');
      // 재연결 시 활성 구독 복원
      for (const symbol of this.symbolRefCount.keys()) {
        this.socket?.emit('subscribe:quote', { symbol });
      }
    });

    this.socket.on('disconnect', () => {
      this.notifyStatus('disconnected');
    });

    this.socket.on('connect_error', () => {
      this.notifyStatus('disconnected');
    });

    this.socket.on('quote:update', (data: RealtimeQuote) => {
      const listeners = this.quoteListeners.get(data.symbol);
      if (listeners) {
        for (const listener of listeners) {
          listener(data);
        }
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.notifyStatus('disconnected');
    }
  }

  subscribeQuote(symbol: string) {
    const prev = this.symbolRefCount.get(symbol) ?? 0;
    this.symbolRefCount.set(symbol, prev + 1);
    // 첫 구독자일 때만 서버에 subscribe 요청
    if (prev === 0) {
      this.socket?.emit('subscribe:quote', { symbol });
    }
  }

  unsubscribeQuote(symbol: string) {
    const prev = this.symbolRefCount.get(symbol) ?? 0;
    if (prev <= 1) {
      this.symbolRefCount.delete(symbol);
      this.socket?.emit('unsubscribe:quote', { symbol });
    } else {
      this.symbolRefCount.set(symbol, prev - 1);
    }
  }

  onQuote(symbol: string, listener: QuoteListener): () => void {
    let listeners = this.quoteListeners.get(symbol);
    if (!listeners) {
      listeners = new Set();
      this.quoteListeners.set(symbol, listeners);
    }
    listeners.add(listener);

    return () => {
      listeners!.delete(listener);
      if (listeners!.size === 0) {
        this.quoteListeners.delete(symbol);
      }
    };
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus(status: ConnectionStatus) {
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }
}

export const socketManager = new SocketManager();
