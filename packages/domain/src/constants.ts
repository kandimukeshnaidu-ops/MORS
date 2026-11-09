export const VISIBILITIES = ['public', 'followers', 'private'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const COLLECTION_VISIBILITIES = ['public', 'private', 'unlisted'] as const;
export type CollectionVisibility = (typeof COLLECTION_VISIBILITIES)[number];

export const EXPERIENCE_STATUSES = ['draft', 'published'] as const;
export type ExperienceStatus = (typeof EXPERIENCE_STATUSES)[number];

export const FOLLOW_STATUSES = ['pending', 'accepted'] as const;
export type FollowStatus = (typeof FOLLOW_STATUSES)[number];

export const FOOD_CATEGORIES = [
  { slug: 'restaurant', label: 'Restaurant', sort_order: 1 },
  { slug: 'street_food', label: 'Street Food', sort_order: 2 },
  { slug: 'home_cooked', label: 'Home Cooked', sort_order: 3 },
  { slug: 'cafe_beverage', label: 'Cafe & Beverage', sort_order: 4 },
  { slug: 'snack', label: 'Snack', sort_order: 5 },
  { slug: 'dessert', label: 'Dessert', sort_order: 6 },
  { slug: 'bakery', label: 'Bakery', sort_order: 7 },
  { slug: 'fast_food', label: 'Fast Food', sort_order: 8 },
  { slug: 'other', label: 'Other', sort_order: 9 },
] as const;

export const RATING_LIMITS = {
  MIN_RAW: 1,
  MAX_RAW: 10,
  MIN_DISPLAY: 0.5,
  MAX_DISPLAY: 5.0,
  STEP: 0.5,
} as const;

export const PHOTO_LIMITS = {
  MAX_COUNT: 10,
  MAX_DIMENSION: 2048,
  MAX_BYTES: 10 * 1024 * 1024, // 10MB client raw limit
} as const;

export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'api',
  'auth',
  'mors',
  'app',
  'settings',
  'explore',
  'dev',
  'terms',
  'privacy',
  'login',
  'register',
  'signup',
  'logout',
  'help',
  'support',
  'profile',
  'collections',
  'dishes',
  'places',
  'feed',
  'status',
  'about',
  'legal',
] as const;

