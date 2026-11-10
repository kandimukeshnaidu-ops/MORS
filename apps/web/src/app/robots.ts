import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mors.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/changelog', '/community-guidelines', '/privacy', '/terms', '/status'],
      disallow: ['/diary', '/settings', '/admin', '/auth/', '/e/', '/c/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
