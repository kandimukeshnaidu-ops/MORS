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
      experience_likes: {
        Row: {
          experience_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          experience_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          experience_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      experience_comments: {
        Row: {
          id: string;
          experience_id: string;
          user_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          experience_id: string;
          user_id: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          experience_id?: string;
          user_id?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string;
          type: NotificationType;
          experience_id: string | null;
          comment_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          actor_id: string;
          type: NotificationType;
          experience_id?: string | null;
          comment_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          actor_id?: string;
          type?: NotificationType;
          experience_id?: string | null;
          comment_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: ReportTarget;
          target_id: string;
          reason: string;
          details: string | null;
          status: 'pending' | 'reviewed' | 'actioned';
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: ReportTarget;
          target_id: string;
          reason: string;
          details?: string | null;
          status?: 'pending' | 'reviewed' | 'actioned';
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: ReportTarget;
          target_id?: string;
          reason?: string;
          details?: string | null;
          status?: 'pending' | 'reviewed' | 'actioned';
          created_at?: string;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          cover_photo_path: string | null;
          visibility: CollectionVisibility;
          share_token: string;
          is_wishlist: boolean;
          items_count: number;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          cover_photo_path?: string | null;
          visibility?: CollectionVisibility;
          share_token?: string;
          is_wishlist?: boolean;
          items_count?: number;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          cover_photo_path?: string | null;
          visibility?: CollectionVisibility;
          share_token?: string;
          is_wishlist?: boolean;
          items_count?: number;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collection_items: {
        Row: {
          id: string;
          collection_id: string;
          item_type: 'experience' | 'dish' | 'place';
          experience_id: string | null;
          dish_id: string | null;
          place_id: string | null;
          note: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          item_type: 'experience' | 'dish' | 'place';
          experience_id?: string | null;
          dish_id?: string | null;
          place_id?: string | null;
          note?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          item_type?: 'experience' | 'dish' | 'place';
          experience_id?: string | null;
          dish_id?: string | null;
          place_id?: string | null;
          note?: string | null;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      collection_likes: {
        Row: {
          id: string;
          collection_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rate_limit_buckets: {
        Row: {
          id: string;
          bucket_key: string;
          window_start: string;
          request_count: number;
        };
        Insert: {
          id?: string;
          bucket_key: string;
          window_start?: string;
          request_count?: number;
        };
        Update: {
          id?: string;
          bucket_key?: string;
          window_start?: string;
          request_count?: number;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: 'ios' | 'android' | 'web';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: 'ios' | 'android' | 'web';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: 'ios' | 'android' | 'web';
          created_at?: string;
          updated_at?: string;
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
      merge_dishes: {
        Args: { p_source_id: string; p_target_id: string };
        Returns: boolean;
      };
      merge_places: {
        Args: { p_source_id: string; p_target_id: string };
        Returns: boolean;
      };
      find_similar_dishes: {
        Args: { p_name: string; p_threshold?: number };
        Returns: Array<{ dish_id: string; name: string; slug: string; similarity: number }>;
      };
      find_similar_places: {
        Args: { p_name: string; p_city?: string | null; p_threshold?: number };
        Returns: Array<{ place_id: string; name: string; city: string | null; similarity: number }>;
      };
      get_home_feed: {
        Args: {
          p_cursor_published_at?: string | null;
          p_cursor_id?: string | null;
          p_limit?: number;
        };
        Returns: Array<{
          id: string;
          user_id: string;
          title: string | null;
          category_slug: string;
          eaten_at: string;
          published_at: string;
          visibility: Visibility;
          overall_rating: number | null;
          description: string | null;
          place_id: string | null;
        }>;
      };
      follow_user: {
        Args: { p_target_id: string };
        Returns: string;
      };
      unfollow_user: {
        Args: { p_target_id: string };
        Returns: boolean;
      };
      respond_follow_request: {
        Args: { p_follower_id: string; p_accept: boolean };
        Returns: boolean;
      };
      block_user: {
        Args: { p_target_id: string };
        Returns: boolean;
      };
      unblock_user: {
        Args: { p_target_id: string };
        Returns: boolean;
      };
      get_suggested_profiles: {
        Args: { p_limit?: number };
        Returns: Array<{
          id: string;
          username: string;
          display_name: string | null;
          avatar_path: string | null;
          bio: string | null;
          experiences_count: number;
          followers_count: number;
        }>;
      };
      toggle_experience_like: {
        Args: { p_experience_id: string };
        Returns: Array<{ liked: boolean; total_likes: number }>;
      };
      add_experience_comment: {
        Args: { p_experience_id: string; p_body: string };
        Returns: Array<{ comment_id: string; created_at: string }>;
      };
      mark_notifications_read: {
        Args: { p_ids?: string[] | null };
        Returns: boolean;
      };
      get_or_create_wishlist: {
        Args: { user_uuid: string };
        Returns: string;
      };
      toggle_collection_like: {
        Args: { coll_id: string };
        Returns: { liked: boolean; likesCount: number };
      };
      can_view_collection: {
        Args: { viewer_id: string | null; target_collection_id: string; req_token?: string | null };
        Returns: boolean;
      };
      search_all: {
        Args: {
          p_query: string;
          p_types?: string[] | null;
          p_city?: string | null;
          p_limit?: number;
        };
        Returns: Array<{
          result_type: 'dish' | 'place' | 'user' | 'experience' | 'collection';
          id: string;
          title: string;
          subtitle: string | null;
          photo_url: string | null;
          url: string;
          score: number;
        }>;
      };
      check_rate_limit: {
        Args: {
          p_key: string;
          p_max_requests: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      request_account_deletion: {
        Args: Record<string, never>;
        Returns: string;
      };
      cancel_account_deletion: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      execute_account_hard_delete: {
        Args: {
          target_user_id: string;
        };
        Returns: boolean;
      };
      register_push_token: {
        Args: {
          p_token: string;
          p_platform: string;
        };
        Returns: boolean;
      };
      get_profile_taste_stats: {
        Args: {
          target_user_id: string;
        };
        Returns: {
          totalMeals: number;
          averageRating: number | null;
          topCategory: string | null;
          favouriteCuisines: Array<{ cuisine: string; count: number }>;
          topRatedDishes: Array<{ name: string; rating: number; timesLogged: number }>;
          monthlyActivity: Array<{ label: string; count: number }>;
        } | null;
      };
      get_explore_trending: {
        Args: {
          p_limit?: number;
        };
        Returns: Array<{
          id: string;
          title: string | null;
          eaten_at: string;
          overall_rating: number | null;
          cuisine: string | null;
          author_id: string;
          author_username: string;
          author_display_name: string | null;
          author_avatar_path: string | null;
          likes_count: number;
          comments_count: number;
          primary_photo_path: string | null;
          trending_score: number;
        }>;
      };
      get_food_year_summary: {
        Args: {
          target_user_id: string;
          p_year: number;
        };
        Returns: {
          year: number;
          totalMealsLogged: number;
          topPlace: string | null;
          bestDish: { name: string | null; rating: number | null };
          topDishes: Array<{ name: string; count: number }>;
        };
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
