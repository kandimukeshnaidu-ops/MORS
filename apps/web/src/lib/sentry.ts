/**
 * Safe Sentry error tracking stub.
 * Safely no-ops in development or when SENTRY_DSN is absent.
 */

export const sentry = {
  isConfigured: (): boolean => Boolean(process.env.SENTRY_DSN),

  captureException: (error: unknown, context?: Record<string, unknown>): void => {
    if (!sentry.isConfigured()) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Sentry:Stub] Exception captured:', error, context);
      }
      return;
    }
  },

  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info'): void => {
    if (!sentry.isConfigured()) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Sentry:Stub] [${level}] ${message}`);
      }
      return;
    }
  },
};
