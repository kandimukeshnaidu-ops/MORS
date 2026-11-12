'use client';

import type { FindMode } from '@mors/domain';

interface FindModeSelectorProps {
  mode: FindMode;
  onChange: (mode: FindMode) => void;
}

export function FindModeSelector({ mode, onChange }: FindModeSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Find intent mode"
      className="flex p-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'restaurants'}
        onClick={() => onChange('restaurants')}
        className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-2 ${
          mode === 'restaurants'
            ? 'bg-[var(--accent-primary)] text-white shadow-sm'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <span>Restaurants</span>
        <span className="text-[10px] opacity-80 font-normal hidden sm:inline">— Where to eat</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={mode === 'food'}
        onClick={() => onChange('food')}
        className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-2 ${
          mode === 'food'
            ? 'bg-[var(--accent-primary)] text-white shadow-sm'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Food & Dishes</span>
        <span className="text-[10px] opacity-80 font-normal hidden sm:inline">— What to eat</span>
      </button>
    </div>
  );
}
