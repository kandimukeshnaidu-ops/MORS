export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Visibility = 'public' | 'followers' | 'private';
export type CollectionVisibility = 'public' | 'private' | 'unlisted';
export type FollowStatus = 'pending' | 'accepted';
export type ExperienceStatus = 'draft' | 'published';
export type NotificationType =
  | 'follow'
  | 'follow_request'
  | 'follow_accepted'
  | 'like'
  | 'comment'
  | 'collection_like';
export type ReportTarget =
  | 'experience'
  | 'comment'
  | 'user'
  | 'collection'
  | 'dish'
  | 'place';

export type Database = {
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
          favourite_cuisines: string[];
          social_links: Json;
          is_private: boolean;
          default_visibility: Visibility;
          discoverable: boolean;
          notification_prefs: Json;
          followers_count: number;
          following_count: number;
          experiences_count: number;
          role: 'user' | 'moderator' | 'admin';
          onboarding_completed_at: string | null;
          deletion_requested_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          location_text?: string | null;
          avatar_path?: string | null;
          cover_path?: string | null;
          favourite_cuisines?: string[];
          social_links?: Json;
          is_private?: boolean;
          default_visibility?: Visibility;
          discoverable?: boolean;
          notification_prefs?: Json;
          followers_count?: number;
          following_count?: number;
          experiences_count?: number;
          role?: 'user' | 'moderator' | 'admin';
          onboarding_completed_at?: string | null;
          deletion_requested_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          location_text?: string | null;
          avatar_path?: string | null;
          cover_path?: string | null;
          favourite_cuisines?: string[];
          social_links?: Json;
          is_private?: boolean;
          default_visibility?: Visibility;
          discoverable?: boolean;
          notification_prefs?: Json;
          followers_count?: number;
          following_count?: number;
          experiences_count?: number;
          role?: 'user' | 'moderator' | 'admin';
          onboarding_completed_at?: string | null;
          deletion_requested_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          status: FollowStatus;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          status?: FollowStatus;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          status?: FollowStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      food_categories: {
        Row: {
          slug: string;
          label: string;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          slug: string;
          label: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          slug?: string;
          label?: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      places: {
        Row: {
          id: string;
          name: string;
          normalized_name: string;
          place_type: string | null;
          parent_place_id: string | null;
          address: string | null;
          city: string | null;
          country: string;
          lat: number | null;
          lng: number | null;
          external_source: string | null;
          external_id: string | null;
          created_by: string | null;
          merged_into_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          normalized_name: string;
          place_type?: string | null;
          parent_place_id?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string;
          lat?: number | null;
          lng?: number | null;
          external_source?: string | null;
          external_id?: string | null;
          created_by?: string | null;
          merged_into_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          normalized_name?: string;
          place_type?: string | null;
          parent_place_id?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string;
          lat?: number | null;
          lng?: number | null;
          external_source?: string | null;
          external_id?: string | null;
          created_by?: string | null;
          merged_into_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      dishes: {
        Row: {
          id: string;
          name: string;
          normalized_name: string;
          slug: string;
          cuisine: string | null;
          description: string | null;
          created_by: string | null;
          merged_into_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          normalized_name: string;
          slug: string;
          cuisine?: string | null;
          description?: string | null;
          created_by?: string | null;
          merged_into_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          normalized_name?: string;
          slug?: string;
          cuisine?: string | null;
          description?: string | null;
          created_by?: string | null;
          merged_into_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      dish_aliases: {
        Row: {
          id: string;
          dish_id: string;
          alias: string;
          normalized_alias: string;
        };
        Insert: {
          id?: string;
          dish_id: string;
          alias: string;
          normalized_alias: string;
        };
        Update: {
          id?: string;
          dish_id?: string;
          alias?: string;
          normalized_alias?: string;
        };
        Relationships: [];
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
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          category_slug: string;
          eaten_at?: string;
          published_at?: string | null;
          status?: ExperienceStatus;
          visibility?: Visibility;
          overall_rating?: number | null;
          description?: string | null;
          place_id?: string | null;
          price_amount?: number | null;
          price_currency?: string;
          cuisine?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          category_slug?: string;
          eaten_at?: string;
          published_at?: string | null;
          status?: ExperienceStatus;
          visibility?: Visibility;
          overall_rating?: number | null;
          description?: string | null;
          place_id?: string | null;
          price_amount?: number | null;
          price_currency?: string;
          cuisine?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      experience_dishes: {
        Row: {
          id: string;
          experience_id: string;
          dish_id: string | null;
          display_name: string;
          position: number;
          rating: number | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          experience_id: string;
          dish_id?: string | null;
          display_name: string;
          position?: number;
          rating?: number | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          experience_id?: string;
          dish_id?: string | null;
          display_name?: string;
          position?: number;
          rating?: number | null;
          note?: string | null;
        };
        Relationships: [];
      };
      experience_photos: {
        Row: {
          id: string;
          experience_id: string;
          storage_path: string;
          width: number;
          height: number;
          blurhash: string | null;
          alt_text: string | null;
          position: number;
        };
        Insert: {
          id?: string;
          experience_id: string;
          storage_path: string;
          width: number;
          height: number;
          blurhash?: string | null;
          alt_text?: string | null;
          position?: number;
        };
        Update: {
          id?: string;
          experience_id?: string;
          storage_path?: string;
          width?: number;
          height?: number;
          blurhash?: string | null;
          alt_text?: string | null;
          position?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      dish_public_stats: {
        Row: {
          dish_id: string;
          public_experience_count: number;
          public_rating_count: number;
          public_rating_avg: number | null;
        };
        Relationships: [];
      };
      place_public_stats: {
        Row: {
          place_id: string;
          public_experience_count: number;
          public_rating_avg: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_experience: {
        Args: { payload: Json };
        Returns: string;
      };
      update_experience: {
        Args: { p_experience_id: string; payload: Json };
        Returns: boolean;
      };
      can_view_experience: {
        Args: { viewer: string | null; exp_id: string };
        Returns: boolean;
      };
      can_view_profile_content: {
        Args: { viewer: string | null; owner: string };
        Returns: boolean;
      };
      is_blocked_between: {
        Args: { a: string; b: string };
        Returns: boolean;
      };
      is_accepted_follower: {
        Args: { viewer: string; target: string };
        Returns: boolean;
      };
      get_calendar_month_summary: {
        Args: { p_user_id: string; p_year: number; p_month: number };
        Returns: Array<{ day: number; count: number; thumbnail_path: string | null }>;
      };
      get_on_this_day_memory: {
        Args: { p_user_id: string };
        Returns: Array<{
          experience_id: string;
          title: string | null;
          dish_name: string;
          years_ago: number;
          thumbnail_path: string | null;
          rating: number | null;
        }>;
      };
    };
    Enums: {
      visibility_t: Visibility;
      collection_vis_t: CollectionVisibility;
      follow_status_t: FollowStatus;
      experience_status_t: ExperienceStatus;
      notification_t: NotificationType;
      report_target_t: ReportTarget;
    };
    CompositeTypes: Record<string, never>;
  };
};
