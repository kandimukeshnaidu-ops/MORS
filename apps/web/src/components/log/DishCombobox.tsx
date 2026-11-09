'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchDishes, createDish, type SearchDishItem } from '@/app/log/actions';

interface DishComboboxProps {
  value: string;
  dishId?: string;
  onChange: (dish: { dishId?: string; name: string }) => void;
  placeholder?: string;
  required?: boolean;
}

export function DishCombobox({
  value,
  dishId,
  onChange,
  placeholder = 'What did you eat? (e.g. Hyderabadi Mutton Biryani)',
  required = false,
}: DishComboboxProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchDishItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange({ name: val, dishId: undefined });

    if (val.trim().length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        const hits = await searchDishes(val);
        setResults(hits);
        setIsSearching(false);
        setIsOpen(true);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelectDish = (dish: SearchDishItem) => {
    setQuery(dish.name);
    onChange({ dishId: dish.id, name: dish.name });
    setIsOpen(false);
  };

  const handleCreateNewDish = async () => {
    if (!query.trim()) return;
    setIsCreating(true);
    const result = await createDish(query.trim());
    setIsCreating(false);

    if ('id' in result) {
      onChange({ dishId: result.id, name: result.name });
    } else {
      onChange({ name: query.trim() });
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0 || query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
        />
        {isSearching && (
          <div className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin rounded-full border-2 border-[var(--text-muted)] border-t-transparent" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-2xl">
          {results.map((dish) => (
            <button
              key={dish.id}
              type="button"
              onClick={() => handleSelectDish(dish)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
            >
              <span className="font-medium">{dish.name}</span>
              {dish.cuisine && (
                <span className="text-xs text-[var(--text-secondary)]">{dish.cuisine}</span>
              )}
            </button>
          ))}

          {query.trim().length >= 2 && !results.some((d) => d.name.toLowerCase() === query.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={handleCreateNewDish}
              disabled={isCreating}
              className="flex w-full items-center gap-2 rounded-lg border-t border-[var(--border-subtle)] px-3 py-2 text-left text-xs font-medium text-[var(--accent-primary)] hover:bg-[var(--bg-primary)] transition-colors"
            >
              <span>+</span>
              <span>
                {isCreating ? 'Saving new dish...' : `Create "${query.trim()}"`}
              </span>
            </button>
          )}

          {results.length === 0 && query.trim().length >= 2 && !isSearching && (
            <div className="px-3 py-2 text-xs text-[var(--text-secondary)]">
              No existing dishes match &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
