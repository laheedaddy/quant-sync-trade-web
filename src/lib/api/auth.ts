import type { ApiResponse } from '@/types/api';
import type { LoginResponse } from '@/types/auth';

const AUTH_BASE = '/auth-api';

async function authRequest<T>(path: string, body: Record<string, string>): Promise<T> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `Auth Error: ${res.status}`;
    try {
      const errorBody = await res.json();
      if (errorBody?.message) message = errorBody.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const json: ApiResponse<T> = await res.json();
  if (!json.isSuccess) {
    throw new Error(json.message);
  }

  return json.data.result;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return authRequest<LoginResponse>('/v1/auth/login', { email, password });
}

export function register(email: string, password: string, name: string): Promise<LoginResponse> {
  return authRequest<LoginResponse>('/v1/auth/register', { email, password, name });
}

export function refreshToken(refreshToken: string): Promise<LoginResponse> {
  return authRequest<LoginResponse>('/v1/auth/refresh', { refreshToken });
}
