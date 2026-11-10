'use client';

import React from 'react';
import { RenderingIndicator } from './RenderingIndicator';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import type { RenderingStage } from '@/hooks/useRenderingLifecycle';

export interface BufferingContainerProps {
  /**
   * Current rendering stage.
   */
  stage: RenderingStage;
  /**
   * Whether the container has previous buffered data available.
   */
  hasBufferedData: boolean;
  /**
   * Skeleton element to render when no buffered data is available yet.
   */
  skeleton: React.ReactNode;
  /**
   * Actual content to render.
   */
  children: React.ReactNode;
  /**
   * Error message or Error object if any.
   */
  error?: Error | string | null;
  /**
   * Optional manual progress (0 to 100).
   */
  progress?: number;
  /**
   * Retry callback when in stalled or error state.
   */
  onRetry?: () => void;
  /**
   * Whether to show the top pinned slim progress bar while buffering.
   */
  showBufferingBar?: boolean;
  /**
   * Optional custom title for error state.
   */
  errorTitle?: string;
  className?: string;
}

export function BufferingContainer({
  stage,
  hasBufferedData,
  skeleton,
  children,
  error,
  progress,
  onRetry,
  showBufferingBar = true,
  errorTitle = 'Unable to display food records',
  className = '',
}: BufferingContainerProps) {
  const isInitialLoading = (stage === 'initializing' || stage === 'processing' || stage === 'fetching' || stage === 'generating' || stage === 'preparing') && !hasBufferedData;
  const isBuffering = (stage === 'initializing' || stage === 'processing' || stage === 'fetching' || stage === 'generating' || stage === 'preparing' || stage === 'stalled') && hasBufferedData;
  const isError = stage === 'error' && !hasBufferedData;
  const isStalledNoData = stage === 'stalled' && !hasBufferedData;

  const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;

  // 1. Error state when no buffered data is available
  if (isError) {
    return (
      <div
        role="alert"
        className={`rounded-2xl border border-[var(--semantic-error)]/30 bg-[var(--bg-surface)] p-8 text-center space-y-4 max-w-xl mx-auto my-6 ${className}`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--semantic-error)]/10 text-[var(--semantic-error)] text-xl font-bold">
          !
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
            {errorTitle}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            {errorMessage || 'A network or rendering error occurred. Your personal data is intact.'}
          </p>
        </div>
        {onRetry && (
          <div className="pt-2">
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry Connection
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 2. Stalled state when initial loading takes too long with no data
  if (isStalledNoData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <RenderingIndicator
          stage="stalled"
          onRetry={onRetry}
          errorMessage={errorMessage}
        />
        {skeleton}
      </div>
    );
  }

  // 3. Initial loading state (no prior data): display layout-accurate skeleton
  if (isInitialLoading) {
    return (
      <div className={`space-y-4 animate-fadeIn ${className}`}>
        <RenderingIndicator
          stage={stage}
          progress={progress}
          variant="compact"
        />
        {skeleton}
      </div>
    );
  }

  // 4. Content ready OR buffering with previous data preserved
  return (
    <div className={`relative ${className}`}>
      {/* Pinned top progress bar during background refetches */}
      {isBuffering && showBufferingBar && (
        <div className="sticky top-0 z-20 mb-3 space-y-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-sm p-2 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] px-1">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              Updating view…
            </span>
            {onRetry && stage === 'stalled' && (
              <button
                type="button"
                onClick={onRetry}
                className="text-[var(--accent-primary)] hover:underline"
              >
                Taking too long? Retry
              </button>
            )}
          </div>
          <ProgressBar size="sm" mode="indeterminate" />
        </div>
      )}

      {/* Content wrapper with smooth transition and no layout shift */}
      <div
        className={`transition-opacity duration-300 ${
          isBuffering ? 'opacity-70 pointer-events-none' : 'opacity-100'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
