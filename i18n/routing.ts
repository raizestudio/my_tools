// i18n/routing.ts
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];

export function isValidLocale(locale: string): locale is Locale {
  return (routing.locales as readonly string[]).includes(locale);
}

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
