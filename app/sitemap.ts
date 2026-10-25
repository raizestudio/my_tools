// app/sitemap.ts
import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://0w.lat';

// Central list of static tool routes
const toolSlugs = [
  'json-converter',
  'url-shtnr',
  'qr-code',
  'secret-share',
  'webhook-catcher',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Root entry
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          fr: `${siteUrl}`,
          en: `${siteUrl}?lang=en`,
        },
      },
    },
  ];

  // Tool entries
  for (const slug of toolSlugs) {
    routes.push({
      url: `${siteUrl}/${slug}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  return routes;
}
