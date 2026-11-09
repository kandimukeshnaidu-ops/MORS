import { describe, it, expect } from 'vitest';
import { UsernameSchema, CreateExperienceInputSchema } from '../src/schemas';

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

  it('rejects experience without any dish', () => {
    const invalid = {
      category_slug: 'restaurant',
      dishes: [],
    };
    expect(CreateExperienceInputSchema.safeParse(invalid).success).toBe(false);
  });
});
