export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Visibility = 'public' | 'followers' | 'private';
export type CollectionVisibility = 'public' | 'private' | 'unlisted';
export type ExperienceStatus = 'draft' | 'published';
export type FollowStatus = 'pending' | 'accepted';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          location_text: string | null;
          avatar_path: string | null;
          cover_path: string | null;
          favourite_cuisines: string[] | null;
          social_links: Json | null;
          is_private: boolean;
          default_visibility: Visibility;
          discoverable: boolean;
          notification_prefs: Json | null;
          followers_count: number;
          following_count: number;
          experiences_count: number;
          role: string;
          onboarding_completed_at: string | null;
          deletion_requested_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      food_experiences: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          category_slug: string;
          eaten_at: string;
          published_at: string | null;
          status: ExperienceStatus;
          visibility: Visibility;
          overall_rating: number | null;
          description: string | null;
          place_id: string | null;
          price_amount: number | null;
          price_currency: string;
          cuisine: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      visibility_t: Visibility;
      collection_vis_t: CollectionVisibility;
      experience_status_t: ExperienceStatus;
      follow_status_t: FollowStatus;
    };
  };
}
