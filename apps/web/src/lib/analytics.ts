/**
 * Safe, opt-in PostHog analytics stub.
 * Safely no-ops when environment variables are not set or user has opted out.
 */

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export const analytics = {
  isConfigured: (): boolean => Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY),

  capture: (eventName: string, properties?: EventProperties): void => {
    if (!analytics.isConfigured()) return;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics:Stub] ${eventName}`, properties);
    }
  },

  identify: (distinctId: string, userProperties?: EventProperties): void => {
    if (!analytics.isConfigured()) return;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics:Identify] ${distinctId}`, userProperties);
    }
  },

  reset: (): void => {
    if (!analytics.isConfigured()) return;
  },
};
