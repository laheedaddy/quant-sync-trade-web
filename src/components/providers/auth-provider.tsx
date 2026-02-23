'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { refreshToken as refreshTokenApi } from '@/lib/api/auth';

const PUBLIC_PATHS = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, refreshToken, isInitialized, initialize, setAuth, clearAuth } = useAuthStore();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-refresh token
  useEffect(() => {
    if (!refreshToken) return;

    const scheduleRefresh = () => {
      // Refresh every 13 minutes (access token is 15 min)
      refreshTimerRef.current = setTimeout(async () => {
        try {
          const stored = useAuthStore.getState().refreshToken;
          if (!stored) return;

          const result = await refreshTokenApi(stored);
          setAuth(result.accessToken, result.refreshToken, {
            userNo: result.userNo,
            email: result.email,
            name: result.name,
          });
          scheduleRefresh();
        } catch {
          clearAuth();
        }
      }, 13 * 60 * 1000);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [refreshToken, setAuth, clearAuth]);

  // Route protection
  useEffect(() => {
    if (!isInitialized) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!accessToken && !isPublic) {
      router.replace('/login');
    } else if (accessToken && pathname === '/login') {
      router.replace('/chart');
    }
  }, [isInitialized, accessToken, pathname, router]);

  // Show nothing until initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0e17]">
        <div className="text-xs text-[#787b86]">Loading...</div>
      </div>
    );
  }

  // On public pages, always render
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return <>{children}</>;

  // On protected pages, wait for auth
  if (!accessToken) return null;

  return <>{children}</>;
}
