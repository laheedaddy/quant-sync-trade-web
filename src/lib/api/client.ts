import type { ApiResponse } from '@/types/api';

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

export async function apiClient<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

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
