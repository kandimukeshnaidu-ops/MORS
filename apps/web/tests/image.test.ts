import { describe, it, expect } from 'vitest';
import { calculateTargetDimensions } from '../src/lib/media/image';

describe('Media Pipeline - calculateTargetDimensions', () => {
  it('retains dimensions if within maxEdge limit', () => {
    const result = calculateTargetDimensions(1200, 800, 2048);
    expect(result).toEqual({ width: 1200, height: 800 });
  });

  it('scales down landscape images so longest edge is 2048px', () => {
    const result = calculateTargetDimensions(4096, 2048, 2048);
    expect(result).toEqual({ width: 2048, height: 1024 });
  });

  it('scales down portrait images so height is 2048px', () => {
    const result = calculateTargetDimensions(1500, 3000, 2048);
    expect(result).toEqual({ width: 1024, height: 2048 });
  });

  it('handles square images proportionally', () => {
    const result = calculateTargetDimensions(3000, 3000, 2048);
    expect(result).toEqual({ width: 2048, height: 2048 });
  });
});
