import { describe, it, expect } from 'vitest';
import { calculateTargetDimensions, PHOTO_SIZES } from '../src/lib/media/image';

describe('Media Pipeline - calculateTargetDimensions (v3)', () => {
  it('retains dimensions if within maxEdge limit', () => {
    const result = calculateTargetDimensions(1000, 700, PHOTO_SIZES.DISPLAY_MAX);
    expect(result).toEqual({ width: 1000, height: 700 });
  });

  it('scales down landscape images so longest edge matches DISPLAY_MAX (1280px)', () => {
    const result = calculateTargetDimensions(2560, 1440, PHOTO_SIZES.DISPLAY_MAX);
    expect(result).toEqual({ width: 1280, height: 720 });
  });

  it('scales down portrait images so height matches DISPLAY_MAX (1280px)', () => {
    const result = calculateTargetDimensions(1000, 2000, PHOTO_SIZES.DISPLAY_MAX);
    expect(result).toEqual({ width: 640, height: 1280 });
  });

  it('scales down thumbnail images to THUMB_MAX (400px)', () => {
    const result = calculateTargetDimensions(1200, 900, PHOTO_SIZES.THUMB_MAX);
    expect(result).toEqual({ width: 400, height: 300 });
  });

  it('handles square images proportionally at 1280px and 400px', () => {
    const displayResult = calculateTargetDimensions(3000, 3000, PHOTO_SIZES.DISPLAY_MAX);
    expect(displayResult).toEqual({ width: 1280, height: 1280 });

    const thumbResult = calculateTargetDimensions(3000, 3000, PHOTO_SIZES.THUMB_MAX);
    expect(thumbResult).toEqual({ width: 400, height: 400 });
  });
});
