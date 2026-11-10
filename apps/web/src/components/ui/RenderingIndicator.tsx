'use client';

import React from 'react';
import { ProgressBar } from './ProgressBar';
import { Button } from './Button';
import {
  type RenderingStage,
  RENDERING_STAGE_LABELS,
  RENDERING_STAGE_PROGRESS,
} from '@/hooks/useRenderingLifecycle';

export interface RenderingIndicatorProps {
  /**
   * Current rendering stage.
   */
  stage: RenderingStage;
  /**
   * Custom stage label override, if any.
   */
  customLabel?: string;
  /**
   * Optional manual progress override (0 to 100).
   * If omitted, uses standard stage progress or indeterminate mode.
   */
  progress?: number;
  /**
   * Whether to show the progress bar beneath the label.
   */
  showProgressBar?: boolean;
  /**
   * Compact variant for badges and small containers; full for cards and page banners.
   */
  variant?: 'compact' | 'full' | 'inline';
  /**
   * Error message if in error state.
   */
  errorMessage?: string;
  /**
   * Callback when user clicks Retry.
   */
  onRetry?: () => void;
  className?: string;
}

export function RenderingIndicator({
  stage,
  customLabel,
  progress,
  showProgressBar = true,
  variant = 'full',
  errorMessage,
  onRetry,
  className = '',
}: RenderingIndicatorProps) {
  if (stage === 'idle') return null;

  const label = customLabel || RENDERING_STAGE_LABELS[stage];
  const calculatedProgress = progress ?? RENDERING_STAGE_PROGRESS[stage];
  const isError = stage === 'error';
  const isStalled = stage === 'stalled';
  const isCompleted = stage === 'completed';
  const isProgressing = !isError && !isStalled && !isCompleted;

  // Inline variant (e.g. for header badges or search inputs)
  if (variant === 'inline') {
    return (
      <div
        className={`inline-flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] ${className}`}
        role="status"
        aria-live="polite"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isError
              ? 'bg-[var(--semantic-error)]'
              : isStalled
              ? 'bg-[var(--semantic-warning)] animate-ping'
              : isCompleted
              ? 'bg-[var(--semantic-success)]'
              : 'bg-[var(--accent-primary)] animate-pulse'
          }`}
        />
        <span>{label}</span>
      </div>
    );
  }

  // Compact variant (e.g. pinned top bar or card sub-header)
  if (variant === 'compact') {
    return (
      <div
        className={`w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 space-y-2 ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isError
                  ? 'bg-[var(--semantic-error)]'
                  : isStalled
                  ? 'bg-[var(--semantic-warning)] animate-pulse'
                  : isCompleted
                  ? 'bg-[var(--semantic-success)]'
                  : 'bg-[var(--accent-primary)] animate-pulse'
              }`}
            />
            <span className="font-mono text-[var(--text-primary)]">{label}</span>
          </div>
          {onRetry && (isError || isStalled) && (
            <Button variant="ghost" size="sm" onClick={onRetry} className="h-6 text-[11px] px-2">
              Retry
            </Button>
          )}
        </div>
        {showProgressBar && isProgressing && (
          <ProgressBar
            size="sm"
            progress={calculatedProgress}
            mode={calculatedProgress > 0 ? 'determinate' : 'indeterminate'}
          />
        )}
      </div>
    );
  }

  // Full variant (e.g. page-level or section-level card)
  return (
    <div
      className={`w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3.5 transition-all ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isError
                  ? 'bg-[var(--semantic-error)]'
                  : isStalled
                  ? 'bg-[var(--semantic-warning)] animate-pulse'
                  : isCompleted
                  ? 'bg-[var(--semantic-success)]'
                  : 'bg-[var(--accent-primary)] animate-pulse'
              }`}
            />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              {isError ? 'Error Encountered' : isStalled ? 'Slow Response' : 'Rendering Lifecycle'}
            </span>
          </div>
          <h4 className="font-display text-sm font-semibold text-[var(--text-primary)]">
            {label}
          </h4>
          {isError && errorMessage && (
            <p className="text-xs text-[var(--semantic-error)]">{errorMessage}</p>
          )}
          {isStalled && (
            <p className="text-xs text-[var(--text-secondary)]">
              This operation is taking a bit longer than expected. You can wait or retry.
            </p>
          )}
        </div>

        {onRetry && (isError || isStalled) && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry Request
          </Button>
        )}
      </div>

      {showProgressBar && isProgressing && (
        <ProgressBar
          size="md"
          progress={calculatedProgress}
          mode={calculatedProgress > 0 ? 'determinate' : 'indeterminate'}
        />
      )}
    </div>
  );
}
