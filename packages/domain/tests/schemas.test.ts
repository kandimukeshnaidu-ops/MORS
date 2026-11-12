import { describe, it, expect } from 'vitest';
import {
  UsernameSchema,
  CreateExperienceInputSchema,
  InviteCodeSchema,
  RestaurantSearchFilterSchema,
  FoodSearchFilterSchema,
  FindModeSchema,
} from '../src/schemas';

describe('Domain Schemas', () => {
  it('validates compliant usernames', () => {
    expect(UsernameSchema.safeParse('mukesh_k').success).toBe(true);
    expect(UsernameSchema.safeParse('john.doe99').success).toBe(true);
    expect(UsernameSchema.safeParse('abc').success).toBe(true);
  });

  it('rejects invalid usernames', () => {
    expect(UsernameSchema.safeParse('ab').success).toBe(false); // too short
    expect(UsernameSchema.safeParse('user with spaces').success).toBe(false);
    expect(UsernameSchema.safeParse('USER_CAPS').success).toBe(false); // no uppercase
    expect(UsernameSchema.safeParse('user@email').success).toBe(false);
    expect(UsernameSchema.safeParse('admin').success).toBe(false); // reserved
    expect(UsernameSchema.safeParse('settings').success).toBe(false); // reserved
  });

  it('validates invite codes', () => {
    expect(InviteCodeSchema.safeParse('HYDERABAD-BETA-2026').success).toBe(true);
    expect(InviteCodeSchema.safeParse('MORS_2026').success).toBe(true);
    expect(InviteCodeSchema.safeParse('ab').success).toBe(false); // too short
    expect(InviteCodeSchema.safeParse('code with spaces').success).toBe(false);
    expect(InviteCodeSchema.safeParse('code$special!').success).toBe(false);
  });

  it('validates food experience payload', () => {
    const valid = {
      title: 'Sunday Biryani',
      category_slug: 'restaurant',
      status: 'draft',
      visibility: 'public',
      overall_rating: 9,
      dishes: [
        {
          display_name: 'Hyderabadi Chicken Dum Biryani',
          position: 0,
          rating: 10,
        },
      ],
      photos: [],
    };
    expect(CreateExperienceInputSchema.safeParse(valid).success).toBe(true);
  });

  it('validates food experience with multi-dimensional restaurant ratings when place_id is provided', () => {
    const validWithRestaurant = {
      title: 'Dinner at Bawarchi',
      category_slug: 'restaurant',
      status: 'published',
      visibility: 'public',
      place_id: '123e4567-e89b-12d3-a456-426614174000',
      overall_rating: 9,
      place_rating_overall: 9,
      place_rating_food: 10,
      place_rating_value: 8,
      place_rating_ambience: 7,
      place_rating_service: 8,
      place_rating_hygiene: 9,
      dining_context: 'dine_in',
      would_return: true,
      dishes: [
        {
          display_name: 'Mutton Biryani',
          position: 0,
          rating: 10,
          taste_rating: 10,
          portion_rating: 9,
          value_rating: 9,
          price_amount: 380,
          dietary_tag: 'non_veg',
          spice_level: 3,
        },
      ],
      photos: [],
    };
    expect(CreateExperienceInputSchema.safeParse(validWithRestaurant).success).toBe(true);
  });

  it('rejects restaurant ratings when place_id is not provided', () => {
    const invalidHomeCooked = {
      title: 'Home Dinner',
      category_slug: 'home_cooked',
      status: 'published',
      visibility: 'public',
      // place_id is null/undefined
      place_rating_food: 9, // cannot rate restaurant food quality if no place!
      dishes: [
        {
          display_name: 'Khatti Dal',
          position: 0,
          rating: 9,
        },
      ],
      photos: [],
    };
    const res = CreateExperienceInputSchema.safeParse(invalidHomeCooked);
    expect(res.success).toBe(false);
  });

  it('rejects experience without any dish', () => {
    const invalid = {
      category_slug: 'restaurant',
      dishes: [],
    };
    expect(CreateExperienceInputSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates find mode and sort options', () => {
    expect(FindModeSchema.safeParse('restaurants').success).toBe(true);
    expect(FindModeSchema.safeParse('food').success).toBe(true);
    expect(FindModeSchema.safeParse('explore').success).toBe(false);
  });

  it('validates restaurant search filters', () => {
    const valid = {
      query: 'Bawarchi',
      city: 'Hyderabad',
      sort: 'rating_score',
      limit: 15,
    };
    const parsed = RestaurantSearchFilterSchema.parse(valid);
    expect(parsed.query).toBe('Bawarchi');
    expect(parsed.city).toBe('Hyderabad');
    expect(parsed.sort).toBe('rating_score');
    expect(parsed.limit).toBe(15);
  });

  it('validates food search filters with dietary tag and spice level', () => {
    const valid = {
      query: 'Haleem',
      cuisine: 'Hyderabadi',
      dietary_tag: 'non_veg',
      spice_level: 3,
      sort: 'rating_count',
    };
    const parsed = FoodSearchFilterSchema.parse(valid);
    expect(parsed.query).toBe('Haleem');
    expect(parsed.dietary_tag).toBe('non_veg');
    expect(parsed.spice_level).toBe(3);
    expect(parsed.sort).toBe('rating_count');
  });
});
