'use client';

import { useSocketConnection } from '@/hooks/use-socket-connection';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocketConnection();
  return <>{children}</>;
}
