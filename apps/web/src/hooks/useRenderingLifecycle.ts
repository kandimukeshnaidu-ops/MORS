'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export type RenderingStage =
  | 'idle'
  | 'initializing'
  | 'processing'
  | 'fetching'
  | 'generating'
  | 'preparing'
  | 'completed'
  | 'stalled'
  | 'error';

export const RENDERING_STAGE_LABELS: Record<RenderingStage, string> = {
  idle: 'Ready',
  initializing: 'Initializing request',
  processing: 'Processing user input',
  fetching: 'Fetching required data',
  generating: 'Generating results',
  preparing: 'Preparing final UI',
  completed: 'Rendering completed',
  stalled: 'Request taking longer than usual',
  error: 'Rendering failed',
};

export const RENDERING_STAGE_PROGRESS: Record<RenderingStage, number> = {
  idle: 0,
  initializing: 15,
  processing: 30,
  fetching: 60,
  generating: 80,
  preparing: 95,
  completed: 100,
  stalled: 95,
  error: 0,
};

export interface UseRenderingLifecycleOptions<T> {
  /**
   * Initial data if available.
   */
  initialData?: T | null;
  /**
   * Timeout in milliseconds before a running request is marked 'stalled' (default 8000ms).
   */
  timeoutMs?: number;
  /**
   * Callback on rendering completion.
   */
  onSuccess?: (data: T) => void;
  /**
   * Callback on rendering failure.
   */
  onError?: (err: Error) => void;
}

export interface RenderingState<T> {
  stage: RenderingStage;
  stageLabel: string;
  progress: number;
  data: T | null;
  bufferedData: T | null;
  isLoading: boolean;
  isBuffering: boolean;
  isStalled: boolean;
  error: Error | null;
  execute: (task: (signal: AbortSignal, updateStage: (stage: RenderingStage) => void) => Promise<T>) => Promise<T | null>;
  retry: () => void;
  reset: () => void;
}

export function useRenderingLifecycle<T = unknown>(
  options: UseRenderingLifecycleOptions<T> = {}
): RenderingState<T> {
  const { initialData = null, timeoutMs = 8000, onSuccess, onError } = options;

  const [stage, setStage] = useState<RenderingStage>(initialData ? 'completed' : 'idle');
  const [data, setData] = useState<T | null>(initialData);
  const [bufferedData, setBufferedData] = useState<T | null>(initialData);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTaskRef = useRef<((signal: AbortSignal, updateStage: (stage: RenderingStage) => void) => Promise<T>) | null>(null);
  const isExecutingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Clear timers safely
  const clearStalledTimer = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  // Safe stage updater that checks mounted state
  const updateStage = useCallback((newStage: RenderingStage) => {
    if (!isMountedRef.current) return;
    setStage(newStage);
  }, []);

  // Main task executor with lifecycle progression and deduplication
  const execute = useCallback(
    async (task: (signal: AbortSignal, updateStage: (stage: RenderingStage) => void) => Promise<T>): Promise<T | null> => {
      // Prevent duplicate concurrent requests
      if (isExecutingRef.current) {
        return null;
      }

      // Abort any prior in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      lastTaskRef.current = task;
      isExecutingRef.current = true;

      setError(null);
      updateStage('initializing');

      // Schedule stalled request timeout
      clearStalledTimer();
      timeoutTimerRef.current = setTimeout(() => {
        if (isMountedRef.current && isExecutingRef.current) {
          updateStage('stalled');
        }
      }, timeoutMs);

      try {
        // Progression: processing -> task execution (which updates to fetching/generating/preparing)
        updateStage('processing');

        const result = await task(controller.signal, updateStage);

        if (!isMountedRef.current || controller.signal.aborted) {
          return null;
        }

        clearStalledTimer();
        updateStage('preparing');

        // Small tick to ensure smooth transition to completed
        setData(result);
        setBufferedData(result);
        updateStage('completed');
        onSuccess?.(result);
        return result;
      } catch (err: unknown) {
        if (!isMountedRef.current || controller.signal.aborted) {
          return null;
        }

        clearStalledTimer();
        const formattedError = err instanceof Error ? err : new Error(String(err));
        setError(formattedError);
        updateStage('error');
        onError?.(formattedError);
        return null;
      } finally {
        isExecutingRef.current = false;
      }
    },
    [clearStalledTimer, onError, onSuccess, timeoutMs, updateStage]
  );

  // Retry previous task
  const retry = useCallback(() => {
    if (lastTaskRef.current) {
      execute(lastTaskRef.current);
    }
  }, [execute]);

  // Reset to idle
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearStalledTimer();
    isExecutingRef.current = false;
    setStage('idle');
    setError(null);
  }, [clearStalledTimer]);

  // Unmount cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearStalledTimer();
    };
  }, [clearStalledTimer]);

  const isLoading = stage === 'initializing' || stage === 'processing' || stage === 'fetching' || stage === 'generating' || stage === 'preparing';
  const isBuffering = isLoading && bufferedData !== null;
  const isStalled = stage === 'stalled';

  return {
    stage,
    stageLabel: RENDERING_STAGE_LABELS[stage],
    progress: RENDERING_STAGE_PROGRESS[stage],
    data,
    bufferedData,
    isLoading,
    isBuffering,
    isStalled,
    error,
    execute,
    retry,
    reset,
  };
}
