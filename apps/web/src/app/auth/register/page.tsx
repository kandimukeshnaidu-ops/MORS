'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signup } from '../actions';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-xl">
        <div className="text-center">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            MORS
          </Link>
          <h1 className="mt-2 font-display text-lg font-medium text-[var(--text-primary)]">
            Begin your food archive
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Private Beta · Hyderabad · By invitation only
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-[var(--semantic-error)]/10 border border-[var(--semantic-error)]/30 p-3 text-xs text-[var(--semantic-error)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="inviteCode"
            name="inviteCode"
            type="text"
            label="Beta Invite Code"
            placeholder="e.g. HYDERABAD-BETA-2026"
            required
            autoCapitalize="characters"
          />

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
            placeholder="Minimum 8 characters"
            required
            autoComplete="new-password"
          />

          {/* Minimum-Age & Terms Confirmation */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <label className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                name="confirmAge"
                required
                className="mt-0.5 rounded border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
              />
              <span>
                I confirm I am at least 18 years of age and agree to the{' '}
                <Link href="/terms" className="text-[var(--accent-primary)] hover:underline" target="_blank">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[var(--accent-primary)] hover:underline" target="_blank">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
            Create Food Journal
          </Button>
        </form>

        <div className="border-t border-[var(--border-subtle)] pt-4 text-center">
          <p className="text-xs text-[var(--text-secondary)]">
            Already have a journal?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-[var(--accent-primary)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
