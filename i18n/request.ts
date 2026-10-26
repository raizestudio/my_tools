// i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { en } from "@/app/lib/i18n/locales/en";
import { fr } from "@/app/lib/i18n/locales/fr";

const dictionaries: Record<string, any> = { en, fr };

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: dictionaries[locale] ?? dictionaries.en,
  };
});
