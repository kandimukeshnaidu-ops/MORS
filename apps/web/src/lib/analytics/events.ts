/**
 * MORS Privacy-First Analytics Instrumentation (v3)
 * Work Package WP-3.1: PostHog consent-gated event logging.
 *
 * NON-NEGOTIABLE PRIVACY RULES (Section G WP-3.1):
 * - NEVER send free text: no titles, notes, comments, bio, or search queries.
 * - NEVER send photo URLs or storage paths.
 * - NEVER send exact place names tied to private/followers entries.
 * - ALLOWED properties: anonymous user id, log_type (quick|detailed), duration_ms, counts, screen_name, app_version.
 */

export type MorsAnalyticsEvent =
  | 'signup_completed'
  | 'onboarding_completed'
  | 'first_log_started'
  | 'first_log_published'
  | 'food_experience_published'
  | 'food_experience_edited'
  | 'food_experience_deleted'
  | 'diary_viewed'
  | 'diary_filter_used'
  | 'diary_entry_opened'
  | 'user_followed'
  | 'follow_request_accepted'
  | 'experience_liked'
  | 'comment_created'
  | 'collection_created'
  | 'collection_item_added'
  | 'collection_shared'
  | 'search_performed'
  | 'explore_item_opened';

export interface EventProperties {
  userId?: string;
  logType?: 'quick' | 'detailed';
  durationMs?: number;
  itemCount?: number;
  screenName?: string;
  categorySlug?: string;
  hasPhoto?: boolean;
  hasRating?: boolean;
  isPrivate?: boolean;
  appVersion?: string;
}

/**
 * Strips any accidental forbidden properties before sending to analytics
 */
export function sanitizeAnalyticsPayload(props: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const forbiddenKeys = ['title', 'description', 'notes', 'bio', 'comment', 'url', 'photo', 'query', 'place'];

  for (const [key, val] of Object.entries(props)) {
    const isForbidden = forbiddenKeys.some((f) => key.toLowerCase().includes(f));
    if (!isForbidden) {
      sanitized[key] = val;
    }
  }

  return sanitized;
}

/**
 * Dispatches an analytics event if user has granted consent and PostHog is loaded
 */
export function trackMorsEvent(event: MorsAnalyticsEvent, properties: EventProperties = {}) {
  if (typeof window === 'undefined') return;

  // Check consent flag
  const consent = localStorage.getItem('mors_analytics_consent');
  if (consent !== 'granted') return;

  const sanitized = sanitizeAnalyticsPayload({
    ...properties,
    appVersion: '0.1.0-beta',
    timestamp: new Date().toISOString(),
  });

  const posthog = (window as any).posthog;
  if (posthog && typeof posthog.capture === 'function') {
    posthog.capture(event, sanitized);
  }
}
