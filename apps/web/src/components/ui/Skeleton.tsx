import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const variantStyles = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md h-4 w-full',
  };

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-[var(--bg-elevated)] ${variantStyles[variant]} ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[var(--bg-surface)]/60 to-transparent animate-shimmer"
      />
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.8s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-shimmer {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
