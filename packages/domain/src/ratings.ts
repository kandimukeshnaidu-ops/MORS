import {
  RATING_LIMITS,
  RESTAURANT_RATING_DIMENSIONS,
  type RestaurantRatingDimension,
} from './constants';

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

/**
 * Calculates a composite restaurant score from rated sub-dimensions.
 * Returns null if no valid sub-dimensions were provided.
 */
export function calculateRestaurantOverallScore(
  dimensions: Partial<Record<RestaurantRatingDimension, number | null | undefined>>
): number | null {
  const scores: number[] = [];
  for (const dim of RESTAURANT_RATING_DIMENSIONS) {
    const val = dimensions[dim];
    if (typeof val === 'number' && isValidRawRating(val)) {
      scores.push(val);
    }
  }
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  return Math.round(sum / scores.length);
}

/**
 * Calculates a confidence-adjusted Bayesian shrinkage ranking score.
 * Formula: (N / (N + M)) * avg + (M / (N + M)) * prior
 * Uses raw 1..10 scale.
 */
export function calculateBayesianScore(
  count: number,
  avgRating: number,
  priorMean = 7.0, // Default 3.5 / 5.0 stars in 1..10 scale
  confidenceConstant = 5.0
): number {
  if (count <= 0) return priorMean;
  const weightedAvg = (count / (count + confidenceConstant)) * avgRating;
  const weightedPrior = (confidenceConstant / (count + confidenceConstant)) * priorMean;
  return Math.round((weightedAvg + weightedPrior) * 100) / 100;
}

/**
 * Classifies an entity into a ranking tier based on evidence volume.
 * - 'ranked': >= 3 eligible public ratings
 * - 'emerging': 1..2 eligible public ratings
 * - 'unranked': 0 eligible public ratings
 */
export function getRankingTier(ratingCount: number): 'ranked' | 'emerging' | 'unranked' {
  if (ratingCount >= 3) return 'ranked';
  if (ratingCount >= 1) return 'emerging';
  return 'unranked';
}

// Aliases for unified naming across domain & app
export const dbRatingToDisplay = rawRatingToDisplay;
export const displayRatingToDb = displayRatingToRaw;
export const formatDisplayRating = formatRating;

