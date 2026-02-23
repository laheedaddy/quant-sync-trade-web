'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useQuoteStore } from '@/stores/quote-store';
import { useAuthStore } from '@/stores/auth-store';

const NAV_ITEMS = [
  { label: 'Chart', href: '/chart' },
  { label: 'Management', href: '/management' },
];

const STATUS_CONFIG = {
  connected: { color: 'bg-[#26a69a]', label: 'Live', pulse: true },
  connecting: { color: 'bg-[#ff9800]', label: 'Connecting...', pulse: true },
  disconnected: { color: 'bg-[#ef5350]', label: 'Offline', pulse: false },
} as const;

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const connectionStatus = useQuoteStore((s) => s.connectionStatus);
  const config = STATUS_CONFIG[connectionStatus];
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-[#2a2e39] bg-[#131722]">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-[#d1d4dc] tracking-wider">
          Quant Sync Trade
        </h1>
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-2 py-1 text-xs font-mono rounded transition-colors',
                pathname.startsWith(item.href)
                  ? 'text-[#d1d4dc] bg-[#2a2e39]'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]/50',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              config.color,
              config.pulse && 'animate-pulse',
            )}
          />
          <span className="text-xs font-mono text-[#787b86]">
            {config.label}
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#2a2e39]">
            <span className="text-xs text-[#787b86]">{user.name}</span>
            <button
              onClick={handleLogout}
              className="text-[10px] text-[#787b86] hover:text-[#ef5350] transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
