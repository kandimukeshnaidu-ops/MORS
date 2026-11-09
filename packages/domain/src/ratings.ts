import { RATING_LIMITS } from './constants';

/**
 * Converts smallint half-star rating (1..10) to UI float representation (0.5..5.0).
 */
export function rawRatingToDisplay(raw: number): number {
  if (raw < RATING_LIMITS.MIN_RAW || raw > RATING_LIMITS.MAX_RAW) {
    throw new RangeError(
      `Raw rating must be between ${RATING_LIMITS.MIN_RAW} and ${RATING_LIMITS.MAX_RAW}, received ${raw}`
    );
  }
  return raw / 2;
}

/**
 * Converts UI float rating (0.5..5.0) to smallint half-star representation (1..10).
 */
export function displayRatingToRaw(display: number): number {
  if (display < RATING_LIMITS.MIN_DISPLAY || display > RATING_LIMITS.MAX_DISPLAY) {
    throw new RangeError(
      `Display rating must be between ${RATING_LIMITS.MIN_DISPLAY} and ${RATING_LIMITS.MAX_DISPLAY}, received ${display}`
    );
  }
  return Math.round(display * 2);
}

/**
 * Checks whether a given rating is a valid raw smallint (1..10 integer).
 */
export function isValidRawRating(raw: unknown): raw is number {
  return (
    typeof raw === 'number' &&
    Number.isInteger(raw) &&
    raw >= RATING_LIMITS.MIN_RAW &&
    raw <= RATING_LIMITS.MAX_RAW
  );
}

/**
 * Formats a raw rating for display, e.g. 9 -> "4.5★"
 */
export function formatRating(raw: number | null | undefined): string {
  if (raw == null || !isValidRawRating(raw)) {
    return 'Unrated';
  }
  return `${rawRatingToDisplay(raw).toFixed(1)}★`;
}
