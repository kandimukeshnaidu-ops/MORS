'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchPlaces, createPlace, type SearchPlaceItem } from '@/app/log/actions';

interface PlaceComboboxProps {
  value: string;
  placeId?: string;
  onChange: (place: { placeId?: string; name: string }) => void;
  placeholder?: string;
}

export function PlaceCombobox({
  value,
  placeId,
  onChange,
  placeholder = 'Where did you eat? (e.g. Shah Ghouse, or leave blank for home-cooked)',
}: PlaceComboboxProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchPlaceItem[]>([]);
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
    onChange({ name: val, placeId: undefined });

    if (val.trim().length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        const hits = await searchPlaces(val);
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

  const handleSelectPlace = (place: SearchPlaceItem) => {
    setQuery(place.name);
    onChange({ placeId: place.id, name: place.name });
    setIsOpen(false);
  };

  const handleCreateNewPlace = async () => {
    if (!query.trim()) return;
    setIsCreating(true);
    const result = await createPlace(query.trim());
    setIsCreating(false);

    if ('id' in result) {
      onChange({ placeId: result.id, name: result.name });
    } else {
      onChange({ name: query.trim() });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange({ placeId: undefined, name: '' });
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
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors pr-10"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-3.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Clear place"
          >
            ✕
          </button>
        )}

        {isSearching && (
          <div className="absolute right-8 top-3.5 h-4 w-4 animate-spin rounded-full border-2 border-[var(--text-muted)] border-t-transparent" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-2xl">
          {results.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => handleSelectPlace(place)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
            >
              <span className="font-medium">{place.name}</span>
              {place.city && (
                <span className="text-xs text-[var(--text-secondary)]">{place.city}</span>
              )}
            </button>
          ))}

          {query.trim().length >= 2 && !results.some((p) => p.name.toLowerCase() === query.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={handleCreateNewPlace}
              disabled={isCreating}
              className="flex w-full items-center gap-2 rounded-lg border-t border-[var(--border-subtle)] px-3 py-2 text-left text-xs font-medium text-[var(--accent-primary)] hover:bg-[var(--bg-primary)] transition-colors"
            >
              <span>+</span>
              <span>
                {isCreating ? 'Adding new place...' : `Add "${query.trim()}"`}
              </span>
            </button>
          )}

          {results.length === 0 && query.trim().length >= 2 && !isSearching && (
            <div className="px-3 py-2 text-xs text-[var(--text-secondary)]">
              No places found. Click &quot;Add &apos;{query}&apos;&quot; to record it.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
