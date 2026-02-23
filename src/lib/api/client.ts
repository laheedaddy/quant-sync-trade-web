import type { ApiResponse } from '@/types/api';
import { useAuthStore } from '@/stores/auth-store';
import { refreshToken as refreshTokenApi } from '@/lib/api/auth';

// Route through Next.js rewrite proxy to avoid CORS
const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 동시 다발 401 시 refresh 1회만 실행
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const stored = useAuthStore.getState().refreshToken;
      if (!stored) return false;

      const result = await refreshTokenApi(stored);
      useAuthStore.getState().setAuth(result.accessToken, result.refreshToken, {
        userNo: result.userNo,
        email: result.email,
        name: result.name,
      });
      return true;
    } catch {
      useAuthStore.getState().clearAuth();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  // Inject Bearer token if available
  const token = useAuthStore.getState().accessToken;
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
  });

  // 401 → refresh token으로 갱신 후 1회 재시도
  if (res.status === 401 && token) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = useAuthStore.getState().accessToken;
      const retryRes = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options?.headers,
        },
      });

      if (!retryRes.ok) {
        let message = `API Error: ${retryRes.status} ${retryRes.statusText}`;
        try {
          const errorBody = await retryRes.json();
          if (errorBody?.message) message = errorBody.message;
        } catch { /* ignore */ }
        throw new ApiError(retryRes.status, message);
      }

      const json: ApiResponse<T> = await retryRes.json();
      if (!json.isSuccess) {
        throw new ApiError(json.statusCode, json.message);
      }
      return json.data.result;
    }
    // refresh 실패 → clearAuth 이미 호출됨, 에러 던지기
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    let message = `API Error: ${res.status} ${res.statusText}`;
    try {
      const errorBody = await res.json();
      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // body not parseable - keep default
    }
    throw new ApiError(res.status, message);
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.isSuccess) {
    throw new ApiError(json.statusCode, json.message);
  }

  return json.data.result;
}
