import { z } from 'zod';
import {
  VISIBILITIES,
  COLLECTION_VISIBILITIES,
  EXPERIENCE_STATUSES,
  RATING_LIMITS,
  RESERVED_USERNAMES,
  DINING_CONTEXTS,
  DIETARY_TAGS,
  SPICE_LEVELS,
} from './constants';

export const DbRatingSchema = z
  .number()
  .int()
  .min(RATING_LIMITS.MIN_RAW)
  .max(RATING_LIMITS.MAX_RAW);

export const DiningContextSchema = z.enum(DINING_CONTEXTS);
export const DietaryTagSchema = z.enum(DIETARY_TAGS);
export const SpiceLevelSchema = z
  .number()
  .int()
  .min(SPICE_LEVELS.MIN)
  .max(SPICE_LEVELS.MAX);

export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username cannot exceed 30 characters')
  .regex(
    /^[a-z0-9_.]+$/,
    'Username may only contain lowercase letters, numbers, underscores, and dots'
  )
  .refine(
    (val) => !RESERVED_USERNAMES.includes(val.toLowerCase() as (typeof RESERVED_USERNAMES)[number]),
    'This username is reserved by the system'
  );

export const ProfileUpdateSchema = z.object({
  display_name: z.string().max(60).optional(),
  bio: z.string().max(250).optional(),
  location_text: z.string().max(100).optional(),
  favourite_cuisines: z.array(z.string().max(50)).max(10).optional(),
  is_private: z.boolean().optional(),
  default_visibility: z.enum(VISIBILITIES).optional(),
  discoverable: z.boolean().optional(),
  timezone: z.string().max(60).optional(),
});

export const ExperienceDishInputSchema = z.object({
  dish_id: z.string().uuid().optional(),
  display_name: z.string().min(1, 'Dish name is required').max(120),
  position: z.number().int().min(0),
  rating: DbRatingSchema.nullable().optional(),
  taste_rating: DbRatingSchema.nullable().optional(),
  portion_rating: DbRatingSchema.nullable().optional(),
  value_rating: DbRatingSchema.nullable().optional(),
  price_amount: z.number().nonnegative().nullable().optional(),
  dietary_tag: DietaryTagSchema.nullable().optional(),
  spice_level: SpiceLevelSchema.nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

export const ExperiencePhotoInputSchema = z.object({
  storage_path: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurhash: z.string().optional(),
  alt_text: z.string().max(300).optional(),
  position: z.number().int().min(0),
});

export const RestaurantReviewInputSchema = z.object({
  place_rating_overall: DbRatingSchema.nullable().optional(),
  place_rating_food: DbRatingSchema.nullable().optional(),
  place_rating_value: DbRatingSchema.nullable().optional(),
  place_rating_ambience: DbRatingSchema.nullable().optional(),
  place_rating_service: DbRatingSchema.nullable().optional(),
  place_rating_hygiene: DbRatingSchema.nullable().optional(),
  dining_context: DiningContextSchema.nullable().optional(),
  would_return: z.boolean().nullable().optional(),
});

export const CreateExperienceInputSchema = z
  .object({
    client_request_id: z.string().uuid().optional(),
    title: z.string().max(120).nullable().optional(),
    category_slug: z.string().min(1),
    eaten_at: z.string().datetime().optional(),
    status: z.enum(EXPERIENCE_STATUSES).default('draft'),
    visibility: z.enum(VISIBILITIES).default('public'),
    overall_rating: DbRatingSchema.nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    place_id: z.string().uuid().nullable().optional(),
    // Multi-dimensional restaurant review fields (Optional, only valid when place_id is provided)
    place_rating_overall: DbRatingSchema.nullable().optional(),
    place_rating_food: DbRatingSchema.nullable().optional(),
    place_rating_value: DbRatingSchema.nullable().optional(),
    place_rating_ambience: DbRatingSchema.nullable().optional(),
    place_rating_service: DbRatingSchema.nullable().optional(),
    place_rating_hygiene: DbRatingSchema.nullable().optional(),
    dining_context: DiningContextSchema.nullable().optional(),
    would_return: z.boolean().nullable().optional(),
    price_amount: z.number().nonnegative().nullable().optional(),
    price_currency: z.string().length(3).default('INR'),
    cuisine: z.string().max(60).nullable().optional(),
    tags: z.array(z.string().max(40)).max(15).default([]),
    dishes: z.array(ExperienceDishInputSchema).min(1, 'At least one dish is required'),
    photos: z.array(ExperiencePhotoInputSchema).max(10).default([]),
  })
  .refine(
    (data) => {
      // Invariant: If place_id is absent, place_rating_* and restaurant fields MUST be null/undefined
      if (!data.place_id) {
        return (
          data.place_rating_overall == null &&
          data.place_rating_food == null &&
          data.place_rating_value == null &&
          data.place_rating_ambience == null &&
          data.place_rating_service == null &&
          data.place_rating_hygiene == null &&
          data.dining_context == null &&
          data.would_return == null
        );
      }
      return true;
    },
    {
      message: 'Restaurant review dimensions require a valid place_id',
      path: ['place_id'],
    }
  );

export const CollectionInputSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(100),
  description: z.string().max(500).nullable().optional(),
  visibility: z.enum(COLLECTION_VISIBILITIES).default('private'),
  system_key: z.string().max(50).nullable().optional(),
});

export const InviteCodeSchema = z
  .string()
  .trim()
  .min(4, 'Invite code must be at least 4 characters')
  .max(32, 'Invite code cannot exceed 32 characters')
  .regex(/^[A-Za-z0-9\-_]+$/, 'Invite code contains invalid characters');

export const FindModeSchema = z.enum(['restaurants', 'food']);
export const FindSortSchema = z.enum(['relevance', 'rating_count', 'rating_score']);

export const RestaurantSearchFilterSchema = z.object({
  query: z.string().trim().optional(),
  city: z.string().trim().optional(),
  cuisine: z.string().trim().optional(),
  place_type: z.string().trim().optional(),
  sort: FindSortSchema.default('relevance'),
  limit: z.number().int().min(1).max(50).default(25),
  offset: z.number().int().min(0).default(0),
});

export const FoodSearchFilterSchema = z.object({
  query: z.string().trim().optional(),
  cuisine: z.string().trim().optional(),
  dietary_tag: DietaryTagSchema.optional(),
  spice_level: SpiceLevelSchema.optional(),
  sort: FindSortSchema.default('relevance'),
  limit: z.number().int().min(1).max(50).default(25),
  offset: z.number().int().min(0).default(0),
});

export type UsernameInput = z.infer<typeof UsernameSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type ExperienceDishInput = z.infer<typeof ExperienceDishInputSchema>;
export type ExperiencePhotoInput = z.infer<typeof ExperiencePhotoInputSchema>;
export type RestaurantReviewInput = z.infer<typeof RestaurantReviewInputSchema>;
export type CreateExperienceInput = z.infer<typeof CreateExperienceInputSchema>;
export type CollectionInput = z.infer<typeof CollectionInputSchema>;
export type InviteCodeInput = z.infer<typeof InviteCodeSchema>;
export type FindMode = z.infer<typeof FindModeSchema>;
export type FindSort = z.infer<typeof FindSortSchema>;
export type RestaurantSearchFilter = z.infer<typeof RestaurantSearchFilterSchema>;
export type FoodSearchFilter = z.infer<typeof FoodSearchFilterSchema>;

