'use client';

import React, { useState } from 'react';
import { rawRatingToDisplay } from '@mors/domain';

export interface RatingStarsProps {
  /** Raw rating from 1 to 10 (half-stars: 1 = 0.5, 10 = 5.0). Null if unrated. */
  value?: number | null;
  /** Callback fired when user selects a new raw rating (1..10). If omitted, renders read-only. */
  onChange?: (newRaw: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function RatingStars({
  value = null,
  onChange,
  size = 'md',
  label = 'Rating',
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const isInteractive = Boolean(onChange);
  const activeValue = hoverValue ?? value ?? 0;

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onChange) return;
    const current = value ?? 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(10, current + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, current - 1));
    }
  };

  return (
    <div
      className="inline-flex items-center gap-1.5"
      role={isInteractive ? 'slider' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={label}
      aria-valuenow={value ?? 0}
      aria-valuemin={1}
      aria-valuemax={10}
      aria-valuetext={value ? `${rawRatingToDisplay(value)} out of 5 stars` : 'Unrated'}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const rawLeft = starIndex * 2 - 1;
          const rawRight = starIndex * 2;

          const isFull = activeValue >= rawRight;
          const isHalf = activeValue === rawLeft;

          return (
            <div
              key={starIndex}
              className={`relative cursor-${isInteractive ? 'pointer' : 'default'} text-[var(--border-strong)]`}
              onMouseLeave={() => isInteractive && setHoverValue(null)}
            >
              {/* Star Background outline */}
              <svg
                className={`${starSizes[size]} transition-colors`}
                viewBox="0 0 24 24"
                fill={isFull ? 'var(--accent-primary)' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>

              {/* Half-star fill overlay */}
              {isHalf && (
                <div className="absolute inset-0 overflow-hidden w-1/2 pointer-events-none">
                  <svg
                    className={`${starSizes[size]} text-[var(--accent-primary)]`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
              )}

              {/* Interactive click targets: left half and right half */}
              {isInteractive && (
                <>
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 w-1/2 opacity-0 cursor-pointer"
                    aria-label={`${starIndex - 0.5} stars`}
                    onMouseEnter={() => setHoverValue(rawLeft)}
                    onClick={() => onChange?.(rawLeft)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 w-1/2 opacity-0 cursor-pointer"
                    aria-label={`${starIndex} stars`}
                    onMouseEnter={() => setHoverValue(rawRight)}
                    onClick={() => onChange?.(rawRight)}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
      <span className="text-xs font-mono font-medium text-[var(--text-secondary)]">
        {value ? rawRatingToDisplay(value).toFixed(1) : '—'}
      </span>
    </div>
  );
}
