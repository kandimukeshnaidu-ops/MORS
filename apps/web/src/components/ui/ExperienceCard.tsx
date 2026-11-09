import 'react';
import { RatingStars } from './RatingStars';
import { Avatar } from './Avatar';
import { Chip } from './Chip';

export interface ExperienceCardProps {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  title?: string | null;
  category: string;
  placeName?: string | null;
  overallRating?: number | null;
  description?: string | null;
  date: string;
  photos?: Array<{
    url: string;
    altText?: string;
  }>;
  dishes: Array<{
    name: string;
    rating?: number | null;
  }>;
}

export function ExperienceCard({
  author,
  title,
  category,
  placeName,
  overallRating,
  description,
  date,
  photos = [],
  dishes = [],
}: ExperienceCardProps) {
  const primaryPhoto = photos[0];

  return (
    <article className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all hover:border-[var(--border-strong)]">
      {/* Header: Author + Meta */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <Avatar
            src={author.avatarUrl}
            alt={author.displayName}
            size="sm"
            fallbackText={author.displayName}
          />
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              {author.displayName}
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              @{author.username}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {date}
          </span>
        </div>
      </div>

      {/* Large Food Photography */}
      {primaryPhoto && (
        <div className="relative aspect-4/3 w-full overflow-hidden bg-[var(--bg-elevated)]">
          <img
            src={primaryPhoto.url}
            alt={primaryPhoto.altText || title || 'Food experience photo'}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-102"
            loading="lazy"
          />
          {photos.length > 1 && (
            <span className="absolute bottom-3 right-3 rounded-md bg-[var(--bg-primary)]/80 backdrop-blur-sm px-2 py-0.5 text-[11px] font-mono text-[var(--text-primary)]">
              1/{photos.length}
            </span>
          )}
        </div>
      )}

      {/* Content Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            {title && (
              <h2 className="font-display text-lg font-medium text-[var(--text-primary)]">
                {title}
              </h2>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Chip label={category} size="sm" />
              {placeName && (
                <span className="text-xs text-[var(--text-secondary)]">
                  at <span className="font-medium text-[var(--text-primary)]">{placeName}</span>
                </span>
              )}
            </div>
          </div>
          {overallRating && (
            <RatingStars value={overallRating} size="sm" label="Overall rating" />
          )}
        </div>

        {description && (
          <p className="mt-2.5 text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        {/* Dishes List */}
        {dishes.length > 0 && (
          <div className="mt-3.5 space-y-1.5 border-t border-[var(--border-subtle)] pt-3">
            {dishes.map((dish, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-0.5"
              >
                <span className="font-medium text-[var(--text-primary)]">
                  {dish.name}
                </span>
                {dish.rating && (
                  <RatingStars value={dish.rating} size="sm" label={`${dish.name} rating`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
