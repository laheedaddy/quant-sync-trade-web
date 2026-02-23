'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === 'register' && !name) return;

    try {
      setLoading(true);
      setError('');

      const result = mode === 'register'
        ? await register(email, password, name)
        : await login(email, password);

      setAuth(result.accessToken, result.refreshToken, {
        userNo: result.userNo,
        email: result.email,
        name: result.name,
      });

      router.replace('/chart');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0e17]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-5 p-6 bg-[#1e222d] rounded-xl border border-[#2a2e39]"
      >
        <div className="text-center">
          <h1 className="text-lg font-bold text-[#d1d4dc]">Quant Sync Trade</h1>
          <p className="text-xs text-[#787b86] mt-1">
            {mode === 'login' ? 'Sign in to continue' : 'Create a new account'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {mode === 'register' && (
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-[#787b86] uppercase tracking-wider">
                Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 text-sm bg-[#131722] border border-[#2a2e39] rounded-lg text-[#d1d4dc] placeholder-[#787b86] focus:outline-none focus:border-[#2962ff]"
                placeholder="Your name"
                autoFocus
                disabled={loading}
              />
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-[#787b86] uppercase tracking-wider">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 text-sm bg-[#131722] border border-[#2a2e39] rounded-lg text-[#d1d4dc] placeholder-[#787b86] focus:outline-none focus:border-[#2962ff]"
              placeholder="your@email.com"
              autoFocus={mode === 'login'}
              disabled={loading}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-[#787b86] uppercase tracking-wider">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 text-sm bg-[#131722] border border-[#2a2e39] rounded-lg text-[#d1d4dc] placeholder-[#787b86] focus:outline-none focus:border-[#2962ff]"
              placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter password'}
              disabled={loading}
            />
          </label>
        </div>

        {error && (
          <p className="text-xs text-[#ef5350] bg-[#ef5350]/10 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password || (mode === 'register' && !name)}
          className="w-full py-2 text-sm font-medium bg-[#2962ff] hover:bg-[#2962ff]/80 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {loading
            ? (mode === 'register' ? 'Creating account...' : 'Signing in...')
            : (mode === 'register' ? 'Create Account' : 'Sign In')}
        </button>

        <p className="text-center text-xs text-[#787b86]">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button type="button" onClick={switchMode} className="text-[#2962ff] hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={switchMode} className="text-[#2962ff] hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
