'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { login } from '../actions';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('redirectTo', redirectTo);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-xl">
      <div className="text-center">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          MORS
        </Link>
        <h1 className="mt-2 font-display text-lg font-medium text-[var(--text-primary)]">
          Sign in to your food journal
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Access your personal archive and taste community
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--semantic-error)]/10 border border-[var(--semantic-error)]/30 p-3 text-xs text-[var(--semantic-error)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-end">
          <Link
            href="/auth/reset-password"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
          Sign In
        </Button>
      </form>

      <div className="border-t border-[var(--border-subtle)] pt-4 text-center">
        <p className="text-xs text-[var(--text-secondary)]">
          New to MORS?{' '}
          <Link
            href="/auth/register"
            className="font-medium text-[var(--accent-primary)] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Suspense fallback={<div className="w-full max-w-sm h-96 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
