import { z } from 'zod';
import {
  VISIBILITIES,
  COLLECTION_VISIBILITIES,
  EXPERIENCE_STATUSES,
  RATING_LIMITS,
  RESERVED_USERNAMES,
} from './constants';

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
});

export const ExperienceDishInputSchema = z.object({
  dish_id: z.string().uuid().optional(),
  display_name: z.string().min(1, 'Dish name is required').max(120),
  position: z.number().int().min(0),
  rating: z
    .number()
    .int()
    .min(RATING_LIMITS.MIN_RAW)
    .max(RATING_LIMITS.MAX_RAW)
    .nullable()
    .optional(),
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

export const CreateExperienceInputSchema = z.object({
  title: z.string().max(120).nullable().optional(),
  category_slug: z.string().min(1),
  eaten_at: z.string().datetime().optional(),
  status: z.enum(EXPERIENCE_STATUSES).default('draft'),
  visibility: z.enum(VISIBILITIES).default('public'),
  overall_rating: z
    .number()
    .int()
    .min(RATING_LIMITS.MIN_RAW)
    .max(RATING_LIMITS.MAX_RAW)
    .nullable()
    .optional(),
  description: z.string().max(2000).nullable().optional(),
  place_id: z.string().uuid().nullable().optional(),
  price_amount: z.number().nonnegative().nullable().optional(),
  price_currency: z.string().length(3).default('INR'),
  cuisine: z.string().max(60).nullable().optional(),
  tags: z.array(z.string().max(40)).max(15).default([]),
  dishes: z.array(ExperienceDishInputSchema).min(1, 'At least one dish is required'),
  photos: z.array(ExperiencePhotoInputSchema).max(10).default([]),
});

export const CollectionInputSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(100),
  description: z.string().max(500).nullable().optional(),
  visibility: z.enum(COLLECTION_VISIBILITIES).default('private'),
});

export type UsernameInput = z.infer<typeof UsernameSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type ExperienceDishInput = z.infer<typeof ExperienceDishInputSchema>;
export type ExperiencePhotoInput = z.infer<typeof ExperiencePhotoInputSchema>;
export type CreateExperienceInput = z.infer<typeof CreateExperienceInputSchema>;
export type CollectionInput = z.infer<typeof CollectionInputSchema>;

