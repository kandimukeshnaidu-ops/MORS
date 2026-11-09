'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { resetPassword } from '../actions';

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await resetPassword(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-xl">
        <div className="text-center">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            MORS
          </Link>
          <h1 className="mt-2 font-display text-lg font-medium text-[var(--text-primary)]">
            Reset Password
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            We will email you a secure recovery link
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-[var(--semantic-error)]/10 border border-[var(--semantic-error)]/30 p-3 text-xs text-[var(--semantic-error)]">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-[var(--semantic-success)]/10 border border-[var(--semantic-success)]/30 p-3 text-xs text-[var(--semantic-success)]">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Account Email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Send Recovery Link
          </Button>
        </form>

        <div className="border-t border-[var(--border-subtle)] pt-4 text-center">
          <Link
            href="/auth/login"
            className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
