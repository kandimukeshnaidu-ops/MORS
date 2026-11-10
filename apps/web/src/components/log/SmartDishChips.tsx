'use client';

import { useState } from 'react';

interface SmartDishChipsProps {
  suggestions?: string[];
  onSelectDish: (dish: string) => void;
}

export function SmartDishChips({
  suggestions = ['Hyderabadi Biryani', 'Pesarattu Dosa', 'Irani Chai'],
  onSelectDish,
}: SmartDishChipsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handlePick = (dish: string) => {
    setSelected(dish);
    onSelectDish(dish);
  };

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-mono text-[var(--accent-primary)]">
          ✨ Suggested Dishes (Tap to fill)
        </span>
        <span className="text-[var(--text-muted)] italic">
          Not right? Type it below
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((dish) => (
          <button
            key={dish}
            type="button"
            onClick={() => handlePick(dish)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              selected === dish
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
            }`}
          >
            {dish}
          </button>
        ))}
      </div>
    </div>
  );
}
