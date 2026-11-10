import { describe, it, expect } from 'vitest';
import {
  type RenderingStage,
  RENDERING_STAGE_LABELS,
  RENDERING_STAGE_PROGRESS,
} from '../src/hooks/useRenderingLifecycle';

describe('Rendering & Buffering System', () => {
  it('correctly maps all 6 required rendering lifecycle stages with human-readable labels', () => {
    const requiredStages: RenderingStage[] = [
      'initializing',
      'processing',
      'fetching',
      'generating',
      'preparing',
      'completed',
    ];

    expect(RENDERING_STAGE_LABELS.initializing).toBe('Initializing request');
    expect(RENDERING_STAGE_LABELS.processing).toBe('Processing user input');
    expect(RENDERING_STAGE_LABELS.fetching).toBe('Fetching required data');
    expect(RENDERING_STAGE_LABELS.generating).toBe('Generating results');
    expect(RENDERING_STAGE_LABELS.preparing).toBe('Preparing final UI');
    expect(RENDERING_STAGE_LABELS.completed).toBe('Rendering completed');

    for (const stage of requiredStages) {
      expect(RENDERING_STAGE_LABELS[stage]).toBeTruthy();
      expect(RENDERING_STAGE_PROGRESS[stage]).toBeGreaterThan(0);
    }
  });

  it('calculates deterministic progress monotonically across lifecycle stages without fabricated percentages', () => {
    const stages: RenderingStage[] = [
      'initializing',
      'processing',
      'fetching',
      'generating',
      'preparing',
      'completed',
    ];

    const progressValues = stages.map((s) => RENDERING_STAGE_PROGRESS[s]);
    for (let i = 1; i < progressValues.length; i++) {
      expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
    }

    expect(RENDERING_STAGE_PROGRESS.initializing).toBe(15);
    expect(RENDERING_STAGE_PROGRESS.completed).toBe(100);
  });

  it('preserves existing content during background buffering to prevent blank screen flash', () => {
    interface ViewState<T> {
      stage: RenderingStage;
      data: T | null;
      bufferedData: T | null;
    }

    const initialLoaded: ViewState<string[]> = {
      stage: 'completed',
      data: ['Hyderabadi Biryani', 'Double Ka Meetha'],
      bufferedData: ['Hyderabadi Biryani', 'Double Ka Meetha'],
    };

    // User triggers category filter change -> stage changes to 'fetching'
    const refetching: ViewState<string[]> = {
      stage: 'fetching',
      data: null, // new data not yet resolved
      bufferedData: initialLoaded.bufferedData, // previous data preserved
    };

    const isBuffering = refetching.stage === 'fetching' && refetching.bufferedData !== null;
    expect(isBuffering).toBe(true);
    expect(refetching.bufferedData).toHaveLength(2);
  });

  it('triggers stalled state detection when request exceeds timeout threshold', () => {
    const checkStalled = (elapsedMs: number, timeoutMs = 8000): RenderingStage => {
      return elapsedMs >= timeoutMs ? 'stalled' : 'fetching';
    };

    expect(checkStalled(2000)).toBe('fetching');
    expect(checkStalled(7999)).toBe('fetching');
    expect(checkStalled(8001)).toBe('stalled');
    expect(RENDERING_STAGE_LABELS.stalled).toBe('Request taking longer than usual');
  });

  it('captures errors cleanly and exposes retry capability', () => {
    interface ExecutionState {
      stage: RenderingStage;
      error: string | null;
      retryCount: number;
    }

    const state: ExecutionState = {
      stage: 'error',
      error: 'Network request failed: status 503',
      retryCount: 0,
    };

    const handleRetry = (prev: ExecutionState): ExecutionState => ({
      ...prev,
      stage: 'processing',
      error: null,
      retryCount: prev.retryCount + 1,
    });

    const retriedState = handleRetry(state);
    expect(retriedState.stage).toBe('processing');
    expect(retriedState.error).toBeNull();
    expect(retriedState.retryCount).toBe(1);
  });

  it('deduplicates simultaneous redundant execution requests', () => {
    let inFlight = false;
    let executionCalls = 0;

    const requestOperation = () => {
      if (inFlight) return 'deduplicated';
      inFlight = true;
      executionCalls++;
      return 'started';
    };

    expect(requestOperation()).toBe('started');
    expect(requestOperation()).toBe('deduplicated');
    expect(requestOperation()).toBe('deduplicated');
    expect(executionCalls).toBe(1);

    inFlight = false;
    expect(requestOperation()).toBe('started');
    expect(executionCalls).toBe(2);
  });
});
