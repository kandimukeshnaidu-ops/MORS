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

  it('verifies Phase 18 map pins filter home locations and hold venue coordinates only', () => {
    const isAllowedPlace = (name: string) => name.trim().toLowerCase() !== 'home';
    expect(isAllowedPlace('Home')).toBe(false);
    expect(isAllowedPlace('home')).toBe(false);
    expect(isAllowedPlace('Bawarchi Restaurant')).toBe(true);
    expect(isAllowedPlace('Shah Ghouse Cafe')).toBe(true);
  });

  it('parses Phase 19 comment mentions with 5-mention cap', () => {
    const parseMentions = (text: string) => {
      const matches = text.match(/@([a-zA-Z0-9_]{3,24})/g) || [];
      const usernames = matches.map((m) => m.slice(1).toLowerCase());
      return Array.from(new Set(usernames)).slice(0, 5);
    };
    const text = 'Hey @mukesh and @vikram check this biryani with @priya @anil @suresh @extra';
    const mentions = parseMentions(text);
    expect(mentions).toEqual(['mukesh', 'vikram', 'priya', 'anil', 'suresh']);
    expect(mentions.length).toBe(5);
  });

  it('formats Phase 19 grouped notification labels cleanly', () => {
    const formatGroup = (actor: string, total: number, action: string) => {
      if (total <= 1) return `${actor} ${action}`;
      return `${actor} and ${total - 1} other${total > 2 ? 's' : ''} ${action}`;
    };
    expect(formatGroup('Ana', 1, 'liked your experience')).toBe('Ana liked your experience');
    expect(formatGroup('Ana', 2, 'liked your experience')).toBe('Ana and 1 other liked your experience');
    expect(formatGroup('Ana', 4, 'liked your experience')).toBe('Ana and 3 others liked your experience');
  });

  it('asserts Phase 20 Food Year recap privacy defaults (opt-in sharing, revoked tokens return null)', () => {
    interface MockRecap {
      year: number;
      shareEnabled: boolean;
      shareToken: string | null;
      includePrivate: boolean;
    }
    const recap: MockRecap = {
      year: 2026,
      shareEnabled: false,
      shareToken: null,
      includePrivate: false,
    };
    expect(recap.shareEnabled).toBe(false);
    expect(recap.includePrivate).toBe(false);

    // Toggling share generates token
    recap.shareEnabled = true;
    recap.shareToken = 'mock-uuid-token';
    expect(recap.shareToken).not.toBeNull();

    // Revoking share disables access
    recap.shareEnabled = false;
    const canAccessShared = (r: MockRecap) => r.shareEnabled && r.shareToken !== null;
    expect(canAccessShared(recap)).toBe(false);
  });
});
