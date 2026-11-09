import { describe, it, expect } from 'vitest';
import {
  rawRatingToDisplay,
  displayRatingToRaw,
  isValidRawRating,
  formatRating,
} from '../src/ratings';

describe('Ratings conversion', () => {
  it('correctly maps raw ratings (1..10) to display floats (0.5..5.0)', () => {
    expect(rawRatingToDisplay(1)).toBe(0.5);
    expect(rawRatingToDisplay(2)).toBe(1.0);
    expect(rawRatingToDisplay(7)).toBe(3.5);
    expect(rawRatingToDisplay(10)).toBe(5.0);
  });

  it('correctly maps display floats (0.5..5.0) to raw ratings (1..10)', () => {
    expect(displayRatingToRaw(0.5)).toBe(1);
    expect(displayRatingToRaw(1.0)).toBe(2);
    expect(displayRatingToRaw(3.5)).toBe(7);
    expect(displayRatingToRaw(5.0)).toBe(10);
  });

  it('throws RangeError for out-of-range raw ratings', () => {
    expect(() => rawRatingToDisplay(0)).toThrow(RangeError);
    expect(() => rawRatingToDisplay(11)).toThrow(RangeError);
    expect(() => rawRatingToDisplay(-1)).toThrow(RangeError);
  });

  it('throws RangeError for out-of-range display ratings', () => {
    expect(() => displayRatingToRaw(0.4)).toThrow(RangeError);
    expect(() => displayRatingToRaw(5.5)).toThrow(RangeError);
  });

  it('validates raw ratings with isValidRawRating', () => {
    expect(isValidRawRating(1)).toBe(true);
    expect(isValidRawRating(10)).toBe(true);
    expect(isValidRawRating(5)).toBe(true);
    expect(isValidRawRating(0)).toBe(false);
    expect(isValidRawRating(11)).toBe(false);
    expect(isValidRawRating(2.5)).toBe(false);
    expect(isValidRawRating('5')).toBe(false);
    expect(isValidRawRating(null)).toBe(false);
  });

  it('formats raw ratings properly', () => {
    expect(formatRating(10)).toBe('5.0★');
    expect(formatRating(7)).toBe('3.5★');
    expect(formatRating(null)).toBe('Unrated');
    expect(formatRating(undefined)).toBe('Unrated');
    expect(formatRating(0)).toBe('Unrated');
  });
});
