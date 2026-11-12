import { describe, it, expect } from 'vitest';
import {
  rawRatingToDisplay,
  displayRatingToRaw,
  isValidRawRating,
  formatRating,
  calculateRestaurantOverallScore,
  calculateBayesianScore,
  getRankingTier,
  dbRatingToDisplay,
  displayRatingToDb,
  formatDisplayRating,
} from '../src/ratings';

describe('Ratings conversion', () => {
  it('correctly maps raw ratings (1..10) to display floats (0.5..5.0)', () => {
    expect(rawRatingToDisplay(1)).toBe(0.5);
    expect(rawRatingToDisplay(2)).toBe(1.0);
    expect(rawRatingToDisplay(7)).toBe(3.5);
    expect(rawRatingToDisplay(10)).toBe(5.0);
    expect(dbRatingToDisplay(10)).toBe(5.0);
  });

  it('correctly maps display floats (0.5..5.0) to raw ratings (1..10)', () => {
    expect(displayRatingToRaw(0.5)).toBe(1);
    expect(displayRatingToRaw(1.0)).toBe(2);
    expect(displayRatingToRaw(3.5)).toBe(7);
    expect(displayRatingToRaw(5.0)).toBe(10);
    expect(displayRatingToDb(5.0)).toBe(10);
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
    expect(formatDisplayRating(10)).toBe('5.0★');
  });

  describe('calculateRestaurantOverallScore', () => {
    it('computes arithmetic average of all 5 dimensions', () => {
      const score = calculateRestaurantOverallScore({
        food_quality: 10,
        value_for_money: 8,
        ambience: 6,
        service: 8,
        hygiene: 8,
      });
      // (10 + 8 + 6 + 8 + 8) / 5 = 40 / 5 = 8 (4.0 stars)
      expect(score).toBe(8);
    });

    it('computes average over only provided dimensions', () => {
      const score = calculateRestaurantOverallScore({
        food_quality: 9,
        hygiene: 7,
      });
      // (9 + 7) / 2 = 8
      expect(score).toBe(8);
    });

    it('returns null if no dimensions are rated', () => {
      expect(calculateRestaurantOverallScore({})).toBeNull();
      expect(calculateRestaurantOverallScore({ food_quality: null, hygiene: undefined })).toBeNull();
    });

    it('ignores invalid dimension values', () => {
      const score = calculateRestaurantOverallScore({
        food_quality: 10,
        hygiene: 12 as unknown as number, // invalid
      });
      expect(score).toBe(10);
    });
  });

  describe('calculateBayesianScore', () => {
    it('returns prior mean when rating count is zero', () => {
      expect(calculateBayesianScore(0, 10, 7.0, 5.0)).toBe(7.0);
    });

    it('shrinks small sample sizes toward the prior mean', () => {
      // 1 rating of 10.0 with prior 7.0 and M=5.0:
      // (1/6) * 10 + (5/6) * 7 = 1.667 + 5.833 = 7.5
      const score = calculateBayesianScore(1, 10, 7.0, 5.0);
      expect(score).toBe(7.5);
    });

    it('converges toward observed average when count is large', () => {
      // 100 ratings of 9.0 with prior 7.0 and M=5.0:
      // (100/105) * 9 + (5/105) * 7 = 8.571 + 0.333 = 8.9
      const score = calculateBayesianScore(100, 9.0, 7.0, 5.0);
      expect(score).toBe(8.9);
    });

    it('prevents small-sample inflation (Scenario 1: 2 ratings @ 10 vs 150 ratings @ 9.0)', () => {
      // Small sample with perfect score
      const smallPerfect = calculateBayesianScore(2, 10.0, 7.0, 5.0);
      // (2/7)*10 + (5/7)*7 = 2.857 + 5.0 = 7.86

      // Large sample with strong score
      const largeStrong = calculateBayesianScore(150, 9.0, 7.0, 5.0);
      // (150/155)*9 + (5/155)*7 = 8.71 + 0.226 = 8.94

      expect(largeStrong).toBeGreaterThan(smallPerfect);
    });

    it('classifies evidence tiers via getRankingTier', () => {
      expect(getRankingTier(0)).toBe('unranked');
      expect(getRankingTier(1)).toBe('emerging');
      expect(getRankingTier(2)).toBe('emerging');
      expect(getRankingTier(3)).toBe('ranked');
      expect(getRankingTier(50)).toBe('ranked');
    });
  });
});
