'use client';

import React, { useState } from 'react';

export interface ImageWithBlurProps {
  src: string;
  alt: string;
  blurPlaceholder?: string | null;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'auto';
  className?: string;
  priority?: boolean;
}

/**
 * Editorial Image Component with blurhash/placeholder support.
 * Preserves strict aspect ratio to prevent Cumulative Layout Shift (CLS).
 */
export function ImageWithBlur({
  src,
  alt,
  blurPlaceholder,
  aspectRatio = 'portrait',
  className = '',
  priority = false,
}: ImageWithBlurProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'portrait'
      ? 'aspect-[4/5]'
      : '';

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[var(--bg-elevated)] ${aspectClass} ${className}`}
      style={{
        backgroundImage: blurPlaceholder ? `url(${blurPlaceholder})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
