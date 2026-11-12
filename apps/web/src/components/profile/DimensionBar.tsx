interface DimensionBarProps {
  label: string;
  rating10: number | null;
  count: number;
  minRatingsThreshold?: number;
}

export function DimensionBar({
  label,
  rating10,
  count,
  minRatingsThreshold = 3,
}: DimensionBarProps) {
  const displayRating = rating10 ? (rating10 / 2).toFixed(1) : null;
  const percentage = rating10 ? Math.min(100, Math.max(0, (rating10 / 10) * 100)) : 0;
  const hasEnoughData = count >= minRatingsThreshold && rating10 !== null;

  return (
    <div className="space-y-1.5" role="group" aria-label={`${label} rating metric`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[var(--text-secondary)]">{label}</span>
        {hasEnoughData ? (
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-[var(--text-primary)]">{displayRating}</span>
            <span className="text-[10px] text-[var(--text-muted)]">/ 5.0 ({count})</span>
          </div>
        ) : (
          <span className="text-[10px] text-[var(--text-muted)] italic">
            {count > 0 ? `${count} ${count === 1 ? 'rating' : 'ratings'} (need 3)` : 'No ratings yet'}
          </span>
        )}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
        {hasEnoughData ? (
          <div
            className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500"
            style={{ width: `${percentage}%` }}
            aria-valuenow={rating10 ? rating10 / 2 : 0}
            aria-valuemin={0}
            aria-valuemax={5}
            role="progressbar"
          />
        ) : (
          <div className="h-full w-0 bg-transparent" />
        )}
      </div>
    </div>
  );
}
