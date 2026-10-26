// app/sitemap.ts
import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://0w.lat";

// Liste centralisée des slugs statiques
const toolSlugs = [
  "json-converter",
  "url-shtnr",
  "qr-code",
  "secret-share",
  "webhook-catcher",
  "jwt-inspector",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const paths = ["", ...toolSlugs];

  return paths.flatMap((path) => {
    const isRoot = path === "";
    const segment = isRoot ? "" : `/${path}`;

    // Crée une entrée pour chaque langue avec ses balises alternates associées
    return routing.locales.map((locale) => ({
      url: `${siteUrl}/${locale}${segment}`,
      lastModified,
      changeFrequency: isRoot ? "weekly" : "monthly",
      priority: isRoot ? 1.0 : 0.8,
      alternates: {
        languages: {
          ...Object.fromEntries(
            routing.locales.map((loc) => [loc, `${siteUrl}/${loc}${segment}`])
          ),
          "x-default": `${siteUrl}/${routing.defaultLocale}${segment}`,
        },
      },
    }));
  });
}
