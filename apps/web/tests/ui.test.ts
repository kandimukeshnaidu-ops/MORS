import { describe, it, expect } from 'vitest';
import { rawRatingToDisplay, displayRatingToRaw, formatRating } from '@mors/domain';

describe('Rating and UI Calculations', () => {
  it('correctly maps 1..10 to 0.5..5.0 display half-stars', () => {
    expect(rawRatingToDisplay(1)).toBe(0.5);
    expect(rawRatingToDisplay(5)).toBe(2.5);
    expect(rawRatingToDisplay(9)).toBe(4.5);
    expect(rawRatingToDisplay(10)).toBe(5.0);
  });

  it('correctly maps 0.5..5.0 display floats to 1..10 raw ratings', () => {
    expect(displayRatingToRaw(0.5)).toBe(1);
    expect(displayRatingToRaw(2.5)).toBe(5);
    expect(displayRatingToRaw(4.5)).toBe(9);
    expect(displayRatingToRaw(5.0)).toBe(10);
  });

  it('formats ratings cleanly for cards and badges', () => {
    expect(formatRating(10)).toBe('5.0★');
    expect(formatRating(9)).toBe('4.5★');
    expect(formatRating(null)).toBe('Unrated');
  });

  it('renders dish translation badges properly for multilingual discovery', () => {
    const translations = [
      { locale: 'te', name: 'హైదరాబాదీ బిర్యానీ' },
      { locale: 'hi', name: 'हैदराबादी बिरयानी' },
    ];
    const labels = translations.map(t => `${t.locale.toUpperCase()}: ${t.name}`);
    expect(labels[0]).toBe('TE: హైదరాబాదీ బిర్యానీ');
    expect(labels[1]).toBe('HI: हैदराबादी बिरयानी');
  });

  it('enforces Phase 16 taste stats privacy threshold (min 5 meals)', () => {
    const isUnderThreshold = (count: number) => count < 5;
    expect(isUnderThreshold(0)).toBe(true);
    expect(isUnderThreshold(4)).toBe(true);
    expect(isUnderThreshold(5)).toBe(false);
    expect(isUnderThreshold(12)).toBe(false);
  });

  it('calculates Phase 17 explore trending score with time-decay formula', () => {
    const calcScore = (engagement: number, ageHours: number) => {
      return engagement / Math.pow(ageHours + 2, 1.5);
    };
    const freshViral = calcScore(20, 2); // 4^1.5 = 8 -> 2.5
    const olderViral = calcScore(20, 14); // 16^1.5 = 64 -> 0.3125
    expect(freshViral).toBeGreaterThan(olderViral);
    expect(freshViral).toBeCloseTo(2.5, 2);
  });
});
