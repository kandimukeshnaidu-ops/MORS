'use client';

export interface ProgressBarProps {
  /**
   * Progress value between 0 and 100.
   * If undefined or mode is 'indeterminate', displays a smooth indeterminate sweep.
   */
  progress?: number;
  /**
   * Mode: 'determinate' for known progress, 'indeterminate' for continuous activity.
   */
  mode?: 'determinate' | 'indeterminate';
  /**
   * Height size variant: 'sm' (2px), 'md' (4px), or 'lg' (6px).
   */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function ProgressBar({
  progress = 0,
  mode = 'determinate',
  size = 'md',
  className = '',
  label = 'Loading progress',
}: ProgressBarProps) {
  const isIndeterminate = mode === 'indeterminate';
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const heightClasses = {
    sm: 'h-0.5',
    md: 'h-1',
    lg: 'h-1.5',
  };

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={isIndeterminate ? undefined : Math.round(clampedProgress)}
      aria-valuemin={isIndeterminate ? undefined : 0}
      aria-valuemax={isIndeterminate ? undefined : 100}
      className={`relative w-full overflow-hidden rounded-full bg-[var(--bg-elevated)] ${heightClasses[size]} ${className}`}
    >
      {isIndeterminate ? (
        <div
          className="absolute inset-y-0 rounded-full bg-[var(--accent-primary)] animate-indeterminate-shimmer"
          style={{
            width: '40%',
            animation: 'indeterminate-sweep 1.6s ease-in-out infinite',
          }}
        />
      ) : (
        <div
          className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      )}
      <style jsx>{`
        @keyframes indeterminate-sweep {
          0% {
            left: -40%;
            width: 30%;
          }
          50% {
            left: 30%;
            width: 50%;
          }
          100% {
            left: 100%;
            width: 30%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-indeterminate-shimmer {
            animation: none !important;
            left: 0 !important;
            width: 100% !important;
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
