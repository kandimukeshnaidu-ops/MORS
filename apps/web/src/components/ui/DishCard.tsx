import 'react';
import { RatingStars } from './RatingStars';

export interface DishCardProps {
  id: string;
  name: string;
  cuisine?: string | null;
  experienceCount?: number;
  ratingAvg?: number | null;
  userRating?: number | null;
}

export function DishCard({
  name,
  cuisine,
  experienceCount = 0,
  ratingAvg,
  userRating,
}: DishCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 transition-colors hover:border-[var(--border-strong)]">
      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          {name}
        </h3>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          {cuisine && <span>{cuisine}</span>}
          {cuisine && <span>•</span>}
          <span>{experienceCount} {experienceCount === 1 ? 'log' : 'logs'}</span>
        </div>
      </div>

      <div className="text-right">
        {userRating ? (
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
              Your rating
            </div>
            <RatingStars value={userRating} size="sm" />
          </div>
        ) : ratingAvg ? (
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
              Community
            </div>
            <div className="text-xs font-mono font-semibold text-[var(--accent-primary)]">
              {ratingAvg.toFixed(1)}★
            </div>
          </div>
        ) : (
          <span className="text-xs text-[var(--text-muted)] italic">Unrated</span>
        )}
      </div>
    </div>
  );
}
