// app/sitemap.ts
import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://0w.lat";

const toolSlugs = [
  "json-converter",
  "url-shtnr",
  "qr-code",
  "secret-share",
  "webhook-catcher",
  "jwt-inspector",
  "passwd-generator",
  "exif-cleaner",
  "har-sanitize",
  "cron-builder",
  "browser-leak-inspector",
  "hex-analyzer",
  "pdf-toolkit",
  "network-probe",
  "link-auditor",
  "dns-auditor",
  "api-runner",
  "image-converter",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const paths = ["", ...toolSlugs];

  return paths.flatMap((path) => {
    const isRoot = path === "";
    const segment = isRoot ? "" : `/${path}`;

    return routing.locales.map((locale) => ({
      url: `${siteUrl}/${locale}${segment}`,
      lastModified,
      changeFrequency: isRoot ? "weekly" : "monthly",
      priority: isRoot ? 1.0 : 0.8,
      alternates: {
        languages: {
          ...Object.fromEntries(
            routing.locales.map((loc) => [loc, `${siteUrl}/${loc}${segment}`]),
          ),
          "x-default": `${siteUrl}/${routing.defaultLocale}${segment}`,
        },
      },
    }));
  });
}
