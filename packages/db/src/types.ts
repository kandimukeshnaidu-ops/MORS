
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "ai_assist_preferences": {
                  Row: {
                    "daily_quota_used": number,"enabled": boolean,"last_reset_at": string,"max_daily_quota": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "daily_quota_used"?: number,"enabled"?: boolean,"last_reset_at"?: string,"max_daily_quota"?: number,"user_id": string
                  }
                  Update: {
                    "daily_quota_used"?: number,"enabled"?: boolean,"last_reset_at"?: string,"max_daily_quota"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_assist_preferences_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"appeals": {
                  Row: {
                    "action_id": string | null,"created_at": string,"handled_by": string | null,"id": string,"resolved_at": string | null,"status": string,"text": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action_id"?: string | null,"created_at"?: string,"handled_by"?: string | null,"id"?: string,"resolved_at"?: string | null,"status"?: string,"text": string,"user_id": string
                  }
                  Update: {
                    "action_id"?: string | null,"created_at"?: string,"handled_by"?: string | null,"id"?: string,"resolved_at"?: string | null,"status"?: string,"text"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "appeals_action_id_fkey"
      columns: ["action_id"]
isOneToOne: false
      referencedRelation: "moderation_actions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appeals_handled_by_fkey"
      columns: ["handled_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appeals_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"cities": {
                  Row: {
                    "country": string,"created_at": string,"id": string,"is_active": boolean,"lat": number,"lng": number,"name": string,"name_local": string | null,"slug": string,"state": string,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "country"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"lat": number,"lng": number,"name": string,"name_local"?: string | null,"slug": string,"state": string,"timezone"?: string
                  }
                  Update: {
                    "country"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"lat"?: number,"lng"?: number,"name"?: string,"name_local"?: string | null,"slug"?: string,"state"?: string,"timezone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"collection_items": {
                  Row: {
                    "collection_id": string,"created_at": string,"dish_id": string | null,"experience_id": string | null,"id": string,"item_type": string,"note": string | null,"place_id": string | null,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "collection_id": string,"created_at"?: string,"dish_id"?: string | null,"experience_id"?: string | null,"id"?: string,"item_type": string,"note"?: string | null,"place_id"?: string | null,"position"?: number
                  }
                  Update: {
                    "collection_id"?: string,"created_at"?: string,"dish_id"?: string | null,"experience_id"?: string | null,"id"?: string,"item_type"?: string,"note"?: string | null,"place_id"?: string | null,"position"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "collection_items_collection_id_fkey"
      columns: ["collection_id"]
isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collection_items_dish_id_fkey"
      columns: ["dish_id"]
isOneToOne: false
      referencedRelation: "dishes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collection_items_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "food_experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collection_items_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"collection_likes": {
                  Row: {
                    "collection_id": string,"created_at": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "collection_id": string,"created_at"?: string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "collection_id"?: string,"created_at"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "collection_likes_collection_id_fkey"
      columns: ["collection_id"]
isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collection_likes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"collection_members": {
                  Row: {
                    "collection_id": string,"created_at": string,"role": string,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "collection_id": string,"created_at"?: string,"role": string,"status": string,"user_id": string
                  }
                  Update: {
                    "collection_id"?: string,"created_at"?: string,"role"?: string,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "collection_members_collection_id_fkey"
      columns: ["collection_id"]
isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collection_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"collections": {
                  Row: {
                    "cover_photo_path": string | null,"created_at": string,"description": string | null,"id": string,"is_wishlist": boolean,"items_count": number,"likes_count": number,"name": string,"share_token": string | null,"system_key": string | null,"updated_at": string,"user_id": string,"visibility": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_photo_path"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_wishlist"?: boolean,"items_count"?: number,"likes_count"?: number,"name": string,"share_token"?: string | null,"system_key"?: string | null,"updated_at"?: string,"user_id": string,"visibility"?: string
                  }
                  Update: {
                    "cover_photo_path"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_wishlist"?: boolean,"items_count"?: number,"likes_count"?: number,"name"?: string,"share_token"?: string | null,"system_key"?: string | null,"updated_at"?: string,"user_id"?: string,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "collections_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"content_hashes": {
                  Row: {
                    "added_at": string,"sha256": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "added_at"?: string,"sha256": string,"status"?: string
                  }
                  Update: {
                    "added_at"?: string,"sha256"?: string,"status"?: string
                  }
                  Relationships: [
                    
                  ]
                },"digest_sends": {
                  Row: {
                    "digest_type": string,"id": string,"period_key": string,"sent_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "digest_type": string,"id"?: string,"period_key": string,"sent_at"?: string,"user_id": string
                  }
                  Update: {
                    "digest_type"?: string,"id"?: string,"period_key"?: string,"sent_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "digest_sends_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"dish_aliases": {
                  Row: {
                    "alias": string,"dish_id": string,"id": string,"normalized_alias": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alias": string,"dish_id": string,"id"?: string,"normalized_alias": string
                  }
                  Update: {
                    "alias"?: string,"dish_id"?: string,"id"?: string,"normalized_alias"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dish_aliases_dish_id_fkey"
      columns: ["dish_id"]
isOneToOne: false
      referencedRelation: "dishes"
      referencedColumns: ["id"]
    }
                  ]
                },"dish_public_stats": {
                  Row: {
                    "dish_id": string,"portion_avg": number | null,"portion_count": number,"public_experience_count": number,"public_rating_avg": number | null,"public_rating_count": number,"taste_avg": number | null,"taste_count": number,"value_avg": number | null,"value_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "dish_id": string,"portion_avg"?: number | null,"portion_count"?: number,"public_experience_count"?: number,"public_rating_avg"?: number | null,"public_rating_count"?: number,"taste_avg"?: number | null,"taste_count"?: number,"value_avg"?: number | null,"value_count"?: number
                  }
                  Update: {
                    "dish_id"?: string,"portion_avg"?: number | null,"portion_count"?: number,"public_experience_count"?: number,"public_rating_avg"?: number | null,"public_rating_count"?: number,"taste_avg"?: number | null,"taste_count"?: number,"value_avg"?: number | null,"value_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "dish_public_stats_dish_id_fkey"
      columns: ["dish_id"]
isOneToOne: true
      referencedRelation: "dishes"
      referencedColumns: ["id"]
    }
                  ]
                },"dish_similarity": {
                  Row: {
                    "dish_a_id": string,"dish_b_id": string,"score": number
                  }
                  ComputedFields: never
                  Insert: {
                    "dish_a_id": string,"dish_b_id": string,"score"?: number
                  }
                  Update: {
                    "dish_a_id"?: string,"dish_b_id"?: string,"score"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "dish_similarity_dish_a_id_fkey"
      columns: ["dish_a_id"]
isOneToOne: false
      referencedRelation: "dishes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "dish_similarity_dish_b_id_fkey"
      columns: ["dish_b_id"]
isOneToOne: false
      referencedRelation: "dishes"
      referencedColumns: ["id"]
    }
                  ]
                },"dish_translations": {
                  Row: {
                    "created_at": string,"dish_id": string,"id": string,"locale": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"dish_id": string,"id"?: string,"locale": string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"dish_id"?: string,"id"?: string,"locale"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dish_translations_dish_id_fkey"
      columns: ["dish_id"]
isOneToOne: false
      referencedRelation: "dishes"
      referencedColumns: ["id"]
    }
                  ]
                },"dishes": {
                  Row: {
                    "created_at": string,"created_by": string | null,"cuisine": string | null,"description": string | null,"id": string,"is_listed": boolean,"merged_into_id": string | null,"name": string,"normalized_name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"cuisine"?: string | null,"description"?: string | null,"id"?: string,"is_listed"?: boolean,"merged_into_id"?: string | null,"name": string,"normalized_name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"cuisine"?: string | null,"description"?: string | null,"id"?: string,"is_listed"?: boolean,"merged_into_id"?: string | null,"name"?: string,"normalized_name"?: string,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dishes_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "dishes_merged_into_id_fkey"
      columns: ["merged_into_id"]
isOneToOne: false
      referencedRelation: "dishes"
      referencedColumns: ["id"]
    }
                  ]
                },"entitlement_grants": {
                  Row: {
                    "entitlement_key": string,"expires_at": string | null,"granted_at": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "entitlement_key": string,"expires_at"?: string | null,"granted_at"?: string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "entitlement_key"?: string,"expires_at"?: string | null,"granted_at"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "entitlement_grants_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"entry_stats_daily": {
                  Row: {
                    "comment_count": number,"day": string,"entry_id": string,"id": string,"likes": number,"saves": number,"views": number
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_count"?: number,"day"?: string,"entry_id": string,"id"?: string,"likes"?: number,"saves"?: number,"views"?: number
                  }
                  Update: {
                    "comment_count"?: number,"day"?: string,"entry_id"?: string,"id"?: string,"likes"?: number,"saves"?: number,"views"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "entry_stats_daily_entry_id_fkey"
      columns: ["entry_id"]
isOneToOne: false
      referencedRelation: "food_experiences"
      referencedColumns: ["id"]
    }
                  ]
                },"experience_comments": {
                  Row: {
                    "body": string,"created_at": string,"experience_id": string,"id": string,"is_hidden": boolean,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"experience_id": string,"id"?: string,"is_hidden"?: boolean,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"experience_id"?: string,"id"?: string,"is_hidden"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "experience_comments_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "food_experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_comments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"experience_dishes": {
                  Row: {
                    "dietary_tag": string | null,"dish_id": string | null,"display_name": string,"experience_id": string,"id": string,"note": string | null,"portion_rating": number | null,"position": number,"price_amount": number | null,"rating": number | null,"spice_level": number | null,"taste_rating": number | null,"value_rating": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "dietary_tag"?: string | null,"dish_id"?: string | null,"display_name": string,"experience_id": string,"id"?: string,"note"?: string | null,"portion_rating"?: number | null,"position"?: number,"price_amount"?: number | null,"rating"?: number | null,"spice_level"?: number | null,"taste_rating"?: number | null,"value_rating"?: number | null
                  }
                  Update: {
                    "dietary_tag"?: string | null,"dish_id"?: string | null,"display_name"?: string,"experience_id"?: string,"id"?: string,"note"?: string | null,"portion_rating"?: number | null,"position"?: number,"price_amount"?: number | null,"rating"?: number | null,"spice_level"?: number | null,"taste_rating"?: number | null,"value_rating"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "experience_dishes_dish_id_fkey"
      columns: ["dish_id"]
isOneToOne: false
      referencedRelation: "dishes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_dishes_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "food_experiences"
      referencedColumns: ["id"]
    }
                  ]
                },"experience_likes": {
                  Row: {
                    "created_at": string,"experience_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"experience_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"experience_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "experience_likes_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "food_experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_likes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"experience_photos": {
                  Row: {
                    "alt_text": string | null,"blurhash": string | null,"experience_id": string,"height": number,"id": string,"position": number,"storage_path": string,"width": number
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string | null,"blurhash"?: string | null,"experience_id": string,"height": number,"id"?: string,"position"?: number,"storage_path": string,"width": number
                  }
                  Update: {
                    "alt_text"?: string | null,"blurhash"?: string | null,"experience_id"?: string,"height"?: number,"id"?: string,"position"?: number,"storage_path"?: string,"width"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "experience_photos_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "food_experiences"
      referencedColumns: ["id"]
    }
                  ]
                },"explore_cache": {
                  Row: {
                    "city": string,"computed_at": string,"id": string,"kind": string,"payload": NonNullable<Json>,"scope": string
                  }
                  ComputedFields: never
                  Insert: {
                    "city"?: string,"computed_at"?: string,"id"?: string,"kind": string,"payload"?: NonNullable<Json>,"scope": string
                  }
                  Update: {
                    "city"?: string,"computed_at"?: string,"id"?: string,"kind"?: string,"payload"?: NonNullable<Json>,"scope"?: string
                  }
                  Relationships: [
                    
                  ]
                },"follows": {
                  Row: {
                    "created_at": string,"follower_id": string,"following_id": string,"status": Database["public"]['Enums']["follow_status_t"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"follower_id": string,"following_id": string,"status": Database["public"]['Enums']["follow_status_t"]
                  }
                  Update: {
                    "created_at"?: string,"follower_id"?: string,"following_id"?: string,"status"?: Database["public"]['Enums']["follow_status_t"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "follows_follower_id_fkey"
      columns: ["follower_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_following_id_fkey"
      columns: ["following_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"food_categories": {
                  Row: {
                    "is_active": boolean,"label": string,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "is_active"?: boolean,"label": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "is_active"?: boolean,"label"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"food_experiences": {
                  Row: {
                    "category_slug": string,"client_request_id": string | null,"created_at": string,"cuisine": string | null,"description": string | null,"dining_context": string | null,"eaten_at": string,"eaten_date": string,"id": string,"overall_rating": number | null,"place_id": string | null,"place_rating_ambience": number | null,"place_rating_food": number | null,"place_rating_hygiene": number | null,"place_rating_overall": number | null,"place_rating_service": number | null,"place_rating_value": number | null,"price_amount": number | null,"price_currency": string,"published_at": string | null,"search_tsv": unknown,"status": Database["public"]['Enums']["experience_status_t"],"tags": (string)[],"title": string | null,"updated_at": string,"user_id": string,"visibility": Database["public"]['Enums']["visibility_t"],"would_return": boolean | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category_slug": string,"client_request_id"?: string | null,"created_at"?: string,"cuisine"?: string | null,"description"?: string | null,"dining_context"?: string | null,"eaten_at"?: string,"eaten_date"?: string,"id"?: string,"overall_rating"?: number | null,"place_id"?: string | null,"place_rating_ambience"?: number | null,"place_rating_food"?: number | null,"place_rating_hygiene"?: number | null,"place_rating_overall"?: number | null,"place_rating_service"?: number | null,"place_rating_value"?: number | null,"price_amount"?: number | null,"price_currency"?: string,"published_at"?: string | null,"search_tsv"?: never,"status"?: Database["public"]['Enums']["experience_status_t"],"tags"?: (string)[],"title"?: string | null,"updated_at"?: string,"user_id": string,"visibility"?: Database["public"]['Enums']["visibility_t"],"would_return"?: boolean | null
                  }
                  Update: {
                    "category_slug"?: string,"client_request_id"?: string | null,"created_at"?: string,"cuisine"?: string | null,"description"?: string | null,"dining_context"?: string | null,"eaten_at"?: string,"eaten_date"?: string,"id"?: string,"overall_rating"?: number | null,"place_id"?: string | null,"place_rating_ambience"?: number | null,"place_rating_food"?: number | null,"place_rating_hygiene"?: number | null,"place_rating_overall"?: number | null,"place_rating_service"?: number | null,"place_rating_value"?: number | null,"price_amount"?: number | null,"price_currency"?: string,"published_at"?: string | null,"search_tsv"?: never,"status"?: Database["public"]['Enums']["experience_status_t"],"tags"?: (string)[],"title"?: string | null,"updated_at"?: string,"user_id"?: string,"visibility"?: Database["public"]['Enums']["visibility_t"],"would_return"?: boolean | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "food_experiences_category_slug_fkey"
      columns: ["category_slug"]
isOneToOne: false
      referencedRelation: "food_categories"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "food_experiences_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "food_experiences_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"import_batches": {
                  Row: {
                    "created_at": string,"errors": NonNullable<Json>,"id": string,"imported_rows": number,"status": string,"total_rows": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"errors"?: NonNullable<Json>,"id"?: string,"imported_rows"?: number,"status"?: string,"total_rows"?: number,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"errors"?: NonNullable<Json>,"id"?: string,"imported_rows"?: number,"status"?: string,"total_rows"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "import_batches_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"invite_codes": {
                  Row: {
                    "code": string,"created_at": string,"created_by": string | null,"expires_at": string | null,"id": string,"max_uses": number,"uses_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"max_uses"?: number,"uses_count"?: number
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"max_uses"?: number,"uses_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "invite_codes_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"invite_redemptions": {
                  Row: {
                    "id": string,"invite_code_id": string,"redeemed_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"invite_code_id": string,"redeemed_at"?: string,"user_id": string
                  }
                  Update: {
                    "id"?: string,"invite_code_id"?: string,"redeemed_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invite_redemptions_invite_code_id_fkey"
      columns: ["invite_code_id"]
isOneToOne: false
      referencedRelation: "invite_codes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invite_redemptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"moderation_actions": {
                  Row: {
                    "action": string,"created_at": string,"id": string,"moderator_id": string,"notes": string | null,"report_id": string | null,"target_id": string,"target_type": Database["public"]['Enums']["report_target_t"]
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"created_at"?: string,"id"?: string,"moderator_id": string,"notes"?: string | null,"report_id"?: string | null,"target_id": string,"target_type": Database["public"]['Enums']["report_target_t"]
                  }
                  Update: {
                    "action"?: string,"created_at"?: string,"id"?: string,"moderator_id"?: string,"notes"?: string | null,"report_id"?: string | null,"target_id"?: string,"target_type"?: Database["public"]['Enums']["report_target_t"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "moderation_actions_moderator_id_fkey"
      columns: ["moderator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moderation_actions_report_id_fkey"
      columns: ["report_id"]
isOneToOne: false
      referencedRelation: "reports"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "actor_id": string,"comment_id": string | null,"created_at": string,"experience_id": string | null,"id": string,"is_read": boolean,"recipient_id": string,"type": Database["public"]['Enums']["notification_t"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"comment_id"?: string | null,"created_at"?: string,"experience_id"?: string | null,"id"?: string,"is_read"?: boolean,"recipient_id": string,"type": Database["public"]['Enums']["notification_t"]
                  }
                  Update: {
                    "actor_id"?: string,"comment_id"?: string | null,"created_at"?: string,"experience_id"?: string | null,"id"?: string,"is_read"?: boolean,"recipient_id"?: string,"type"?: Database["public"]['Enums']["notification_t"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "experience_comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "food_experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"place_public_stats": {
                  Row: {
                    "ambience_avg": number | null,"ambience_count": number,"food_quality_avg": number | null,"food_quality_count": number,"hygiene_avg": number | null,"hygiene_count": number,"place_id": string,"public_experience_count": number,"public_rating_avg": number | null,"public_rating_count": number,"service_avg": number | null,"service_count": number,"value_for_money_avg": number | null,"value_for_money_count": number,"would_return_pct": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ambience_avg"?: number | null,"ambience_count"?: number,"food_quality_avg"?: number | null,"food_quality_count"?: number,"hygiene_avg"?: number | null,"hygiene_count"?: number,"place_id": string,"public_experience_count"?: number,"public_rating_avg"?: number | null,"public_rating_count"?: number,"service_avg"?: number | null,"service_count"?: number,"value_for_money_avg"?: number | null,"value_for_money_count"?: number,"would_return_pct"?: number | null
                  }
                  Update: {
                    "ambience_avg"?: number | null,"ambience_count"?: number,"food_quality_avg"?: number | null,"food_quality_count"?: number,"hygiene_avg"?: number | null,"hygiene_count"?: number,"place_id"?: string,"public_experience_count"?: number,"public_rating_avg"?: number | null,"public_rating_count"?: number,"service_avg"?: number | null,"service_count"?: number,"value_for_money_avg"?: number | null,"value_for_money_count"?: number,"would_return_pct"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "place_public_stats_place_id_fkey"
      columns: ["place_id"]
isOneToOne: true
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"places": {
                  Row: {
                    "address": string | null,"city": string | null,"city_id": string | null,"country": string | null,"created_at": string,"created_by": string | null,"external_id": string | null,"external_source": string | null,"id": string,"is_listed": boolean,"last_synced_at": string | null,"lat": number | null,"lng": number | null,"merged_into_id": string | null,"name": string,"normalized_name": string,"parent_place_id": string | null,"place_type": string | null,"source_attribution": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"city"?: string | null,"city_id"?: string | null,"country"?: string | null,"created_at"?: string,"created_by"?: string | null,"external_id"?: string | null,"external_source"?: string | null,"id"?: string,"is_listed"?: boolean,"last_synced_at"?: string | null,"lat"?: number | null,"lng"?: number | null,"merged_into_id"?: string | null,"name": string,"normalized_name": string,"parent_place_id"?: string | null,"place_type"?: string | null,"source_attribution"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"city"?: string | null,"city_id"?: string | null,"country"?: string | null,"created_at"?: string,"created_by"?: string | null,"external_id"?: string | null,"external_source"?: string | null,"id"?: string,"is_listed"?: boolean,"last_synced_at"?: string | null,"lat"?: number | null,"lng"?: number | null,"merged_into_id"?: string | null,"name"?: string,"normalized_name"?: string,"parent_place_id"?: string | null,"place_type"?: string | null,"source_attribution"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "places_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "places_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "places_merged_into_id_fkey"
      columns: ["merged_into_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "places_parent_place_id_fkey"
      columns: ["parent_place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_votes": {
                  Row: {
                    "created_at": string,"item_id": string,"plan_id": string,"user_id": string,"vote": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"item_id": string,"plan_id": string,"user_id": string,"vote": string
                  }
                  Update: {
                    "created_at"?: string,"item_id"?: string,"plan_id"?: string,"user_id"?: string,"vote"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_votes_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "collection_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_votes_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_votes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"plans": {
                  Row: {
                    "collection_id": string,"created_at": string,"created_by": string,"decided_item_id": string | null,"id": string,"planned_for": string | null,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "collection_id": string,"created_at"?: string,"created_by": string,"decided_item_id"?: string | null,"id"?: string,"planned_for"?: string | null,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "collection_id"?: string,"created_at"?: string,"created_by"?: string,"decided_item_id"?: string | null,"id"?: string,"planned_for"?: string | null,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plans_collection_id_fkey"
      columns: ["collection_id"]
isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plans_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plans_decided_item_id_fkey"
      columns: ["decided_item_id"]
isOneToOne: false
      referencedRelation: "collection_items"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_stats_daily": {
                  Row: {
                    "day": string,"id": string,"new_followers": number,"profile_id": string,"profile_views": number
                  }
                  ComputedFields: never
                  Insert: {
                    "day"?: string,"id"?: string,"new_followers"?: number,"profile_id": string,"profile_views"?: number
                  }
                  Update: {
                    "day"?: string,"id"?: string,"new_followers"?: number,"profile_id"?: string,"profile_views"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_stats_daily_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "allow_indexing": boolean,"allow_taste_comparison": boolean,"avatar_path": string | null,"bio": string | null,"city_id": string | null,"cover_path": string | null,"created_at": string,"default_visibility": Database["public"]['Enums']["visibility_t"],"deletion_pending_at": string | null,"deletion_requested_at": string | null,"discoverable": boolean,"display_name": string | null,"experiences_count": number,"favourite_cuisines": (string)[] | null,"featured_experience_ids": (string)[] | null,"followers_count": number,"following_count": number,"id": string,"is_admin": boolean | null,"is_private": boolean,"locale": string,"location_text": string | null,"memory_digest_opt_in": boolean,"muted_words": (string)[] | null,"notification_prefs": Json | null,"onboarding_completed_at": string | null,"pinned_collection_ids": (string)[] | null,"role": string,"social_links": Json | null,"taste_profile_sharing_enabled": boolean,"timezone": string,"updated_at": string,"username": string,"weekly_digest_opt_in": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "allow_indexing"?: boolean,"allow_taste_comparison"?: boolean,"avatar_path"?: string | null,"bio"?: string | null,"city_id"?: string | null,"cover_path"?: string | null,"created_at"?: string,"default_visibility"?: Database["public"]['Enums']["visibility_t"],"deletion_pending_at"?: string | null,"deletion_requested_at"?: string | null,"discoverable"?: boolean,"display_name"?: string | null,"experiences_count"?: number,"favourite_cuisines"?: (string)[] | null,"featured_experience_ids"?: (string)[] | null,"followers_count"?: number,"following_count"?: number,"id": string,"is_admin"?: never,"is_private"?: boolean,"locale"?: string,"location_text"?: string | null,"memory_digest_opt_in"?: boolean,"muted_words"?: (string)[] | null,"notification_prefs"?: Json | null,"onboarding_completed_at"?: string | null,"pinned_collection_ids"?: (string)[] | null,"role"?: string,"social_links"?: Json | null,"taste_profile_sharing_enabled"?: boolean,"timezone"?: string,"updated_at"?: string,"username": string,"weekly_digest_opt_in"?: boolean
                  }
                  Update: {
                    "allow_indexing"?: boolean,"allow_taste_comparison"?: boolean,"avatar_path"?: string | null,"bio"?: string | null,"city_id"?: string | null,"cover_path"?: string | null,"created_at"?: string,"default_visibility"?: Database["public"]['Enums']["visibility_t"],"deletion_pending_at"?: string | null,"deletion_requested_at"?: string | null,"discoverable"?: boolean,"display_name"?: string | null,"experiences_count"?: number,"favourite_cuisines"?: (string)[] | null,"featured_experience_ids"?: (string)[] | null,"followers_count"?: number,"following_count"?: number,"id"?: string,"is_admin"?: never,"is_private"?: boolean,"locale"?: string,"location_text"?: string | null,"memory_digest_opt_in"?: boolean,"muted_words"?: (string)[] | null,"notification_prefs"?: Json | null,"onboarding_completed_at"?: string | null,"pinned_collection_ids"?: (string)[] | null,"role"?: string,"social_links"?: Json | null,"taste_profile_sharing_enabled"?: boolean,"timezone"?: string,"updated_at"?: string,"username"?: string,"weekly_digest_opt_in"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    }
                  ]
                },"push_tokens": {
                  Row: {
                    "created_at": string,"id": string,"platform": string,"token": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"platform": string,"token": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"platform"?: string,"token"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_tokens_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"rate_limit_buckets": {
                  Row: {
                    "bucket_key": string,"id": string,"request_count": number,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_key": string,"id"?: string,"request_count"?: number,"window_start"?: string
                  }
                  Update: {
                    "bucket_key"?: string,"id"?: string,"request_count"?: number,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rec_feedback": {
                  Row: {
                    "created_at": string,"id": string,"signal": string,"target_id": string,"target_type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"signal": string,"target_id": string,"target_type": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"signal"?: string,"target_id"?: string,"target_type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rec_feedback_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"recaps": {
                  Row: {
                    "data": NonNullable<Json>,"generated_at": string,"id": string,"include_private": boolean,"share_enabled": boolean,"share_token": string | null,"user_id": string,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "data"?: NonNullable<Json>,"generated_at"?: string,"id"?: string,"include_private"?: boolean,"share_enabled"?: boolean,"share_token"?: string | null,"user_id": string,"year": number
                  }
                  Update: {
                    "data"?: NonNullable<Json>,"generated_at"?: string,"id"?: string,"include_private"?: boolean,"share_enabled"?: boolean,"share_token"?: string | null,"user_id"?: string,"year"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "recaps_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"details": string | null,"id": string,"reason": string,"reporter_id": string,"status": string,"target_id": string,"target_type": Database["public"]['Enums']["report_target_t"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"reason": string,"reporter_id": string,"status"?: string,"target_id": string,"target_type": Database["public"]['Enums']["report_target_t"]
                  }
                  Update: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"reason"?: string,"reporter_id"?: string,"status"?: string,"target_id"?: string,"target_type"?: Database["public"]['Enums']["report_target_t"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"spam_signals": {
                  Row: {
                    "created_at": string,"id": string,"score": number,"signal": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"score"?: number,"signal": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"score"?: number,"signal"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "spam_signals_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"storage_cleanup_queue": {
                  Row: {
                    "bucket_id": string,"error_message": string | null,"id": string,"processed_at": string | null,"queued_at": string,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_id": string,"error_message"?: string | null,"id"?: string,"processed_at"?: string | null,"queued_at"?: string,"storage_path": string
                  }
                  Update: {
                    "bucket_id"?: string,"error_message"?: string | null,"id"?: string,"processed_at"?: string | null,"queued_at"?: string,"storage_path"?: string
                  }
                  Relationships: [
                    
                  ]
                },"storage_quotas": {
                  Row: {
                    "quota_bytes": number,"updated_at": string,"used_bytes": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "quota_bytes"?: number,"updated_at"?: string,"used_bytes"?: number,"user_id": string
                  }
                  Update: {
                    "quota_bytes"?: number,"updated_at"?: string,"used_bytes"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "storage_quotas_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"subscriptions": {
                  Row: {
                    "cancel_at_period_end": boolean,"created_at": string,"current_period_end": string,"current_period_start": string,"id": string,"plan": string,"provider": string,"provider_sub_id": string,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_at_period_end"?: boolean,"created_at"?: string,"current_period_end": string,"current_period_start"?: string,"id"?: string,"plan": string,"provider": string,"provider_sub_id": string,"status": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "cancel_at_period_end"?: boolean,"created_at"?: string,"current_period_end"?: string,"current_period_start"?: string,"id"?: string,"plan"?: string,"provider"?: string,"provider_sub_id"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"suspensions": {
                  Row: {
                    "ends_at": string | null,"id": string,"is_active": boolean,"issued_by": string | null,"reason": string,"starts_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ends_at"?: string | null,"id"?: string,"is_active"?: boolean,"issued_by"?: string | null,"reason": string,"starts_at"?: string,"user_id": string
                  }
                  Update: {
                    "ends_at"?: string | null,"id"?: string,"is_active"?: boolean,"issued_by"?: string | null,"reason"?: string,"starts_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "suspensions_issued_by_fkey"
      columns: ["issued_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "suspensions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"trusted_reporters": {
                  Row: {
                    "trust_score": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "trust_score"?: number,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "trust_score"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trusted_reporters_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_stats_owner": {
                  Row: {
                    "computed_at": string,"data": NonNullable<Json>,"period": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "computed_at"?: string,"data"?: NonNullable<Json>,"period": string,"user_id": string
                  }
                  Update: {
                    "computed_at"?: string,"data"?: NonNullable<Json>,"period"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_stats_owner_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_stats_public": {
                  Row: {
                    "computed_at": string,"data": NonNullable<Json>,"period": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "computed_at"?: string,"data"?: NonNullable<Json>,"period": string,"user_id": string
                  }
                  Update: {
                    "computed_at"?: string,"data"?: NonNullable<Json>,"period"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_stats_public_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_strikes": {
                  Row: {
                    "created_at": string,"expires_at": string,"id": string,"issued_by": string | null,"reason": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at"?: string,"id"?: string,"issued_by"?: string | null,"reason": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string,"id"?: string,"issued_by"?: string | null,"reason"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_strikes_issued_by_fkey"
      columns: ["issued_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_strikes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_taste_vectors": {
                  Row: {
                    "top_categories": NonNullable<Json>,"top_cuisines": NonNullable<Json>,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "top_categories"?: NonNullable<Json>,"top_cuisines"?: NonNullable<Json>,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "top_categories"?: NonNullable<Json>,"top_cuisines"?: NonNullable<Json>,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_taste_vectors_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "pg_all_foreign_keys": {
                  Row: {
                    "fk_columns": (unknown)[] | null,"fk_constraint_name": unknown,"fk_schema_name": unknown,"fk_table_name": unknown,"fk_table_oid": unknown,"is_deferrable": boolean | null,"is_deferred": boolean | null,"match_type": string | null,"on_delete": string | null,"on_update": string | null,"pk_columns": (unknown)[] | null,"pk_constraint_name": unknown,"pk_index_name": unknown,"pk_schema_name": unknown,"pk_table_name": unknown,"pk_table_oid": unknown
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"tap_funky": {
                  Row: {
                    "args": string | null,"is_definer": boolean | null,"is_strict": boolean | null,"is_visible": boolean | null,"kind": unknown,"langoid": unknown,"name": unknown,"oid": unknown,"owner": unknown,"returns": string | null,"returns_set": boolean | null,"schema": unknown,"volatility": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "_cleanup":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"_contract_on":
{ Args: { "": string }; Returns: unknown
                           },
"_currtest":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"_db_privs":
{ Args: Record<PropertyKey, never>; Returns: (unknown)[]
                           },
"_extensions":
{ Args: Record<PropertyKey, never>; Returns: unknown[]
                           },
"_get":
{ Args: { "": string }; Returns: number
                           },
"_get_latest":
{ Args: { "": string }; Returns: (number)[]
                           },
"_get_note":
{ Args: { "": string }; Returns: string
                           },
"_is_verbose":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"_prokind":
{ Args: { "p_oid": unknown }; Returns: unknown
                           },
"_query":
{ Args: { "": string }; Returns: string
                           },
"_refine_vol":
{ Args: { "": string }; Returns: string
                           },
"_retval":
{ Args: { "": string }; Returns: string
                           },
"_table_privs":
{ Args: Record<PropertyKey, never>; Returns: (unknown)[]
                           },
"_temptypes":
{ Args: { "": string }; Returns: string
                           },
"_todo":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"add_experience_comment":
{ Args: { "p_body": string,"p_experience_id": string }; Returns: {
              "comment_id": string,"created_at": string
            }[]
                           },
"block_user":
{ Args: { "p_target_id": string }; Returns: boolean
                           },
"can_view_collection":
{ Args: { "req_token"?: string,"target_collection_id": string,"viewer_id": string }; Returns: boolean
                           },
"can_view_experience":
{ Args: { "exp_id": string,"viewer": string }; Returns: boolean
                           },
"can_view_profile_content":
{ Args: { "owner": string,"viewer": string }; Returns: boolean
                           },
"cancel_account_deletion":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"cancel_user_subscription":
{ Args: { "p_user_id": string }; Returns: boolean
                           },
"cast_plan_vote":
{ Args: { "p_item_id": string,"p_plan_id": string,"p_vote": string }; Returns: undefined
                           },
"check_invite_code":
{ Args: { "p_code": string }; Returns: boolean
                           },
"check_rate_limit":
{ Args: { "p_key": string,"p_max_requests": number,"p_window_seconds": number }; Returns: boolean
                           },
"check_user_is_suspended":
{ Args: { "p_user_id": string }; Returns: boolean
                           },
"col_is_null":
{ Args: { "column_name": unknown,"description"?: string,"schema_name": unknown,"table_name": unknown }; Returns: string
                           } |
{ Args: { "column_name": unknown,"description"?: string,"table_name": unknown }; Returns: string
                           },
"col_not_null":
{ Args: { "column_name": unknown,"description"?: string,"schema_name": unknown,"table_name": unknown }; Returns: string
                           } |
{ Args: { "column_name": unknown,"description"?: string,"table_name": unknown }; Returns: string
                           },
"convert_plan_to_meal_drafts":
{ Args: { "p_plan_id": string }; Returns: number
                           },
"create_experience":
{ Args: { "payload": Json }; Returns: string
                           },
"create_personal_referral_code":
{ Args: { "p_custom_suffix"?: string }; Returns: string
                           },
"delete_experience":
{ Args: { "p_id": string }; Returns: boolean
                           },
"diag":
{ Args: { "msg": unknown }; Returns: { error: true } & "Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
                           } |
{ Args: { "msg": string }; Returns: { error: true } & "Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
                           },
"diag_test_name":
{ Args: { "": string }; Returns: string
                           },
"dismiss_recommendation":
{ Args: { "p_signal": string,"p_target_id": string,"p_target_type": string }; Returns: undefined
                           },
"do_tap":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           } |
{ Args: { "": string }; Returns: string[]
                           },
"execute_account_hard_delete":
{ Args: { "target_user_id": string }; Returns: boolean
                           },
"fail":
{ Args: Record<PropertyKey, never>; Returns: string
                           } |
{ Args: { "": string }; Returns: string
                           },
"find_food_dishes":
{ Args: { "p_cuisine"?: string,"p_dietary_tag"?: string,"p_limit"?: number,"p_offset"?: number,"p_query"?: string,"p_sort"?: string }; Returns: {
              "cuisine": string,"description": string,"id": string,"name": string,"normalized_name": string,"portion_avg": number,"public_experience_count": number,"public_rating_avg": number,"public_rating_count": number,"similarity": number,"slug": string,"taste_avg": number,"top_places": Json,"value_avg": number
            }[]
                           },
"find_restaurants":
{ Args: { "p_city"?: string,"p_cuisine"?: string,"p_limit"?: number,"p_offset"?: number,"p_place_type"?: string,"p_query"?: string,"p_sort"?: string }; Returns: {
              "address": string,"ambience_avg": number,"city": string,"food_quality_avg": number,"hygiene_avg": number,"id": string,"lat": number,"lng": number,"name": string,"normalized_name": string,"place_type": string,"public_experience_count": number,"public_rating_avg": number,"public_rating_count": number,"service_avg": number,"similarity": number,"value_for_money_avg": number,"would_return_pct": number
            }[]
                           },
"find_similar_dishes":
{ Args: { "p_name": string,"p_threshold"?: number }; Returns: {
              "dish_id": string,"name": string,"similarity": number,"slug": string
            }[]
                           },
"find_similar_places":
{ Args: { "p_city"?: string,"p_name": string,"p_threshold"?: number }; Returns: {
              "city": string,"name": string,"place_id": string,"similarity": number
            }[]
                           },
"findfuncs":
{ Args: { "": string }; Returns: (string)[]
                           },
"finish":
{ Args: { "exception_on_failure"?: boolean }; Returns: string[]
                           },
"follow_user":
{ Args: { "p_target_id": string }; Returns: string
                           },
"format_type_string":
{ Args: { "": string }; Returns: string
                           },
"generate_bulk_entries":
{ Args: { "p_count"?: number,"p_user_id": string }; Returns: number
                           },
"get_active_cities":
{ Args: Record<PropertyKey, never>; Returns: {
              "country": string,"id": string,"name": string,"name_local": string,"slug": string,"state": string,"timezone": string
            }[]
                           },
"get_ai_assist_dishes":
{ Args: { "p_cuisine"?: string,"p_hint"?: string }; Returns: {
              "dish_name": string,"source": string
            }[]
                           },
"get_calendar_month_summary":
{ Args: { "p_month": number,"p_user_id": string,"p_year": number }; Returns: {
              "count": number,"day": number,"thumbnail_path": string
            }[]
                           },
"get_creator_analytics":
{ Args: { "p_profile_id": string }; Returns: Json
                           },
"get_digest_data":
{ Args: { "p_user_id": string }; Returns: Json
                           },
"get_dish_profile":
{ Args: { "p_slug": string,"p_viewer_id"?: string }; Returns: Json
                           },
"get_explore_cached":
{ Args: { "p_city"?: string,"p_kind"?: string }; Returns: Json
                           },
"get_explore_trending":
{ Args: { "p_limit"?: number }; Returns: {
              "author_avatar_path": string,"author_display_name": string,"author_id": string,"author_username": string,"comments_count": number,"cuisine": string,"eaten_at": string,"id": string,"likes_count": number,"overall_rating": number,"primary_photo_path": string,"title": string,"trending_score": number
            }[]
                           },
"get_food_year_summary":
{ Args: { "p_year": number,"target_user_id": string }; Returns: Json
                           },
"get_grouped_notifications":
{ Args: { "p_user_id": string }; Returns: {
              "actors": Json,"group_key": string,"is_read": boolean,"latest_created_at": string,"notification_type": Database["public"]['Enums']["notification_t"],"sample_message": string,"target_id": string,"total_actors": number
            }[]
                           },
"get_home_feed":
{ Args: { "p_cursor_id"?: string,"p_cursor_published_at"?: string,"p_limit"?: number }; Returns: {
              "category_slug": string,"description": string,"eaten_at": string,"id": string,"overall_rating": number,"place_id": string,"published_at": string,"title": string,"user_id": string,"visibility": Database["public"]['Enums']["visibility_t"]
            }[]
                           },
"get_home_feed_v2":
{ Args: { "p_cursor_id"?: string,"p_cursor_published_at"?: string,"p_limit"?: number }; Returns: Json
                           },
"get_indexable_public_profiles":
{ Args: Record<PropertyKey, never>; Returns: {
              "updated_at": string,"username": string
            }[]
                           },
"get_map_pins":
{ Args: { "p_city"?: string,"p_max_lat"?: number,"p_max_lng"?: number,"p_min_lat"?: number,"p_min_lng"?: number }; Returns: {
              "address": string,"city": string,"id": string,"is_visited_by_viewer": boolean,"lat": number,"lng": number,"name": string,"public_experience_count": number,"public_rating_avg": number,"source_attribution": string
            }[]
                           },
"get_on_this_day_memory":
{ Args: { "p_user_id": string }; Returns: {
              "dish_name": string,"experience_id": string,"rating": number,"thumbnail_path": string,"title": string,"years_ago": number
            }[]
                           },
"get_or_create_wishlist":
{ Args: { "user_uuid": string }; Returns: string
                           },
"get_personal_taste_identity":
{ Args: { "p_user_id"?: string,"p_viewer_id"?: string }; Returns: Json
                           },
"get_place_profile":
{ Args: { "p_place_id": string,"p_viewer_id"?: string }; Returns: Json
                           },
"get_profile_taste_stats":
{ Args: { "target_user_id": string }; Returns: Json
                           },
"get_recap_by_token":
{ Args: { "p_token": string }; Returns: Json
                           },
"get_regional_dish_rankings":
{ Args: { "p_city"?: string,"p_cuisine"?: string,"p_dimension"?: string,"p_limit"?: number,"p_offset"?: number }; Returns: {
              "bayesian_score": number,"cuisine": string,"id": string,"is_ranked": boolean,"name": string,"portion_avg": number,"rank_position": number,"rating_avg": number,"rating_count": number,"slug": string,"taste_avg": number,"top_places": Json,"value_avg": number
            }[]
                           },
"get_regional_overview":
{ Args: { "p_city"?: string }; Returns: {
              "city_name": string,"ranked_dishes": number,"ranked_venues": number,"regional_avg_rating": number,"total_dishes": number,"total_venues": number
            }[]
                           },
"get_regional_prior_mean":
{ Args: { "p_city"?: string,"p_default_mean"?: number }; Returns: number
                           },
"get_regional_restaurant_rankings":
{ Args: { "p_city"?: string,"p_cuisine"?: string,"p_dimension"?: string,"p_limit"?: number,"p_offset"?: number }; Returns: {
              "address": string,"ambience_avg": number,"bayesian_score": number,"city": string,"food_quality_avg": number,"hygiene_avg": number,"id": string,"is_ranked": boolean,"name": string,"place_type": string,"rank_position": number,"rating_avg": number,"rating_count": number,"service_avg": number,"value_avg": number,"would_return_pct": number
            }[]
                           },
"get_suggested_profiles":
{ Args: { "p_limit"?: number }; Returns: {
              "avatar_path": string,"bio": string,"display_name": string,"experiences_count": number,"followers_count": number,"id": string,"username": string
            }[]
                           },
"get_taste_aligned_profiles":
{ Args: { "p_limit"?: number }; Returns: {
              "avatar_path": string,"bio": string,"display_name": string,"id": string,"shared_cuisine": string,"shared_high_rated_dishes": number,"username": string
            }[]
                           },
"get_taste_recommendations":
{ Args: { "p_user_id": string }; Returns: {
              "dish_id": string,"dish_name": string,"public_rating_avg": number,"reason": string
            }[]
                           },
"get_user_storage_usage":
{ Args: { "p_user_id": string }; Returns: Json
                           },
"has_entitlement":
{ Args: { "p_key": string,"p_user_id": string }; Returns: boolean
                           },
"has_unique":
{ Args: { "": string }; Returns: string
                           },
"import_food_entries":
{ Args: { "p_batch_id": string,"p_entries": Json }; Returns: Json
                           },
"in_todo":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_accepted_follower":
{ Args: { "target": string,"viewer": string }; Returns: boolean
                           },
"is_blocked_between":
{ Args: { "a": string,"b": string }; Returns: boolean
                           },
"is_blocked_bidirectional":
{ Args: { "a": string,"b": string }; Returns: boolean
                           },
"is_empty":
{ Args: { "": string }; Returns: string
                           },
"isnt_empty":
{ Args: { "": string }; Returns: string
                           },
"lives_ok":
{ Args: { "": string }; Returns: string
                           },
"mark_notifications_read":
{ Args: { "p_ids"?: (string)[] }; Returns: boolean
                           },
"merge_dishes":
{ Args: { "p_source_id": string,"p_target_id": string }; Returns: boolean
                           },
"merge_places":
{ Args: { "p_source_id": string,"p_target_id": string }; Returns: boolean
                           },
"no_plan":
{ Args: Record<PropertyKey, never>; Returns: boolean[]
                           },
"num_failed":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"os_name":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"pass":
{ Args: Record<PropertyKey, never>; Returns: string
                           } |
{ Args: { "": string }; Returns: string
                           },
"pg_version":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"pg_version_num":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"pgtap_version":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"recompute_all_stats":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"recompute_dish_stats":
{ Args: { "p_dish_id": string }; Returns: undefined
                           },
"recompute_place_stats":
{ Args: { "p_place_id": string }; Returns: undefined
                           },
"recompute_user_stats":
{ Args: { "p_user_id": string }; Returns: undefined
                           },
"redeem_invite_code":
{ Args: { "p_code": string,"p_user_id": string }; Returns: boolean
                           },
"register_push_token":
{ Args: { "p_platform": string,"p_token": string }; Returns: boolean
                           },
"request_account_deletion":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"respond_follow_request":
{ Args: { "p_accept": boolean,"p_follower_id": string }; Returns: boolean
                           },
"runtests":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           } |
{ Args: { "": string }; Returns: string[]
                           },
"search_all":
{ Args: { "p_city"?: string,"p_limit"?: number,"p_query": string,"p_types"?: (string)[] }; Returns: {
              "id": string,"photo_url": string,"result_type": string,"score": number,"subtitle": string,"title": string,"url": string
            }[]
                           },
"set_taste_profile_sharing":
{ Args: { "p_enabled": boolean }; Returns: boolean
                           },
"skip":
{ Args: { "": string }; Returns: string
                           } |
{ Args: { "how_many": number,"why": string }; Returns: string
                           },
"submit_user_appeal":
{ Args: { "p_action_id": string,"p_text": string }; Returns: string
                           },
"throws_ok":
{ Args: { "": string }; Returns: string
                           },
"todo":
{ Args: { "how_many": number }; Returns: boolean[]
                           } |
{ Args: { "how_many": number,"why": string }; Returns: boolean[]
                           } |
{ Args: { "why": string }; Returns: boolean[]
                           } |
{ Args: { "how_many": number,"why": string }; Returns: boolean[]
                           },
"todo_end":
{ Args: Record<PropertyKey, never>; Returns: boolean[]
                           },
"todo_start":
{ Args: Record<PropertyKey, never>; Returns: boolean[]
                           } |
{ Args: { "": string }; Returns: boolean[]
                           },
"toggle_collection_like":
{ Args: { "coll_id": string }; Returns: Json
                           },
"toggle_experience_like":
{ Args: { "p_experience_id": string }; Returns: {
              "liked": boolean,"total_likes": number
            }[]
                           },
"toggle_recap_sharing":
{ Args: { "p_include_private"?: boolean,"p_share_enabled": boolean,"p_year": number }; Returns: string
                           },
"unblock_user":
{ Args: { "p_target_id": string }; Returns: boolean
                           },
"unfollow_user":
{ Args: { "p_target_id": string }; Returns: boolean
                           },
"update_experience":
{ Args: { "p_experience_id": string,"payload": Json }; Returns: boolean
                           },
"validate_storage_upload_path":
{ Args: { "p_bucket_id": string,"p_name": string }; Returns: boolean
                           }
          }
          Enums: {
            "collection_vis_t": "public"|"private"|"unlisted","experience_status_t": "draft"|"published","follow_status_t": "pending"|"accepted","notification_t": "follow"|"follow_request"|"follow_accepted"|"like"|"comment"|"collection_like"|"mention","report_target_t": "experience"|"comment"|"user"|"collection"|"dish"|"place","visibility_t": "public"|"followers"|"private"
          }
          CompositeTypes: {
            "_time_trial_type": {
                        "a_time": number | null
                      }
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "collection_vis_t": ["public", "private", "unlisted"],"experience_status_t": ["draft", "published"],"follow_status_t": ["pending", "accepted"],"notification_t": ["follow", "follow_request", "follow_accepted", "like", "comment", "collection_like", "mention"],"report_target_t": ["experience", "comment", "user", "collection", "dish", "place"],"visibility_t": ["public", "followers", "private"]
          }
        }
} as const
