'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { completeOnboarding } from '../auth/actions';

const CUISINE_OPTIONS = [
  'Hyderabadi',
  'South Indian',
  'Andhra',
  'North Indian',
  'Mughlai',
  'Street Food',
  'Bakery & Cafe',
  'Italian',
  'Asian',
  'Arabian',
];

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  const toggleCuisine = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter((c) => c !== cuisine));
    } else {
      setSelectedCuisines([...selectedCuisines, cuisine]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('favouriteCuisines', JSON.stringify(selectedCuisines));

    const result = await completeOnboarding(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-xl">
        <div>
          <span className="text-xs font-mono text-[var(--accent-primary)] uppercase tracking-wider">
            Step 1 of 1 — Personalize
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Setup your food taste profile
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Choose your unique handle and privacy preferences for your food journal.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-[var(--semantic-error)]/10 border border-[var(--semantic-error)]/30 p-3 text-xs text-[var(--semantic-error)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="username"
            name="username"
            label="Username (Handles: 3-30 chars, lowercase, numbers, _ or .)"
            placeholder="e.g. foodlover_hyd"
            required
            autoFocus
          />

          <Input
            id="displayName"
            name="displayName"
            label="Display Name (Your Name or Alias)"
            placeholder="e.g. Sameer K"
            required
          />

          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
              Favourite Cuisines & Interests (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((cuisine) => (
                <Chip
                  key={cuisine}
                  label={cuisine}
                  selected={selectedCuisines.includes(cuisine)}
                  onClick={() => toggleCuisine(cuisine)}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
            <h2 className="text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider font-mono">
              Privacy Defaults
            </h2>

            <div>
              <label htmlFor="defaultVisibility" className="block text-xs text-[var(--text-secondary)] mb-1">
                Default Entry Visibility
              </label>
              <select
                id="defaultVisibility"
                name="defaultVisibility"
                defaultValue="public"
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]"
              >
                <option value="public">Public (Visible to everyone)</option>
                <option value="followers">Followers-Only (Only approved followers)</option>
                <option value="private">Private (Only you can see)</option>
              </select>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer pt-1">
              <input
                type="checkbox"
                name="isPrivate"
                className="mt-0.5 rounded border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
              />
              <span>
                Make my whole profile private (requires you to approve followers before they see your journal).
              </span>
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-4" isLoading={loading}>
            Complete & Enter Journal
          </Button>
        </form>
      </div>
    </div>
  );
}
